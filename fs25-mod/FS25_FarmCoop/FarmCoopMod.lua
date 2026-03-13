--[[
    FarmCoop Bridge Mod for Farming Simulator 25

    Polls a local XML file (written by the bridge service) for pending
    transactions and executes them in-game:
      - Money transactions: adds funds to the target farm
      - Equipment transactions: spawns vehicles at the farm's spawn point

    After processing, writes a confirmations XML file that the bridge
    service reads and reports back to the web API.
]]

FarmCoopMod = {}

-- Configuration
FarmCoopMod.POLL_INTERVAL_MS = 10000  -- 10 seconds
FarmCoopMod.TRANSACTIONS_FILE = "pending_transactions.xml"
FarmCoopMod.CONFIRMATIONS_FILE = "confirmations.xml"

-- State
FarmCoopMod.timeSinceLastPoll = 0
FarmCoopMod.modSettingsDir = nil
FarmCoopMod.pendingConfirmations = {}
FarmCoopMod.processedIds = {}  -- Set of already-processed transaction IDs

---
--- Lifecycle: called when the mod is loaded with the savegame
---
function FarmCoopMod:loadMap(name)
    self.modSettingsDir = g_currentModSettingsDirectory

    if self.modSettingsDir == nil then
        print("[FarmCoop] ERROR: g_currentModSettingsDirectory is nil, mod cannot function")
        return
    end

    -- Ensure the mod settings directory exists
    createFolder(self.modSettingsDir)

    print("[FarmCoop] Bridge mod loaded")
    print("[FarmCoop] Watching: " .. self.modSettingsDir)
    print("[FarmCoop] Poll interval: " .. self.POLL_INTERVAL_MS .. "ms")

    -- Dump a few store items so we can find correct XML paths
    self:dumpStoreItems()

    self.timeSinceLastPoll = 0
    self.pendingConfirmations = {}
    self.processedIds = {}
end

---
--- Log some store item XML filenames to help find correct vehicle paths
---
function FarmCoopMod:dumpStoreItems()
    if g_storeManager == nil then
        print("[FarmCoop] g_storeManager not available")
        return
    end

    print("[FarmCoop] === Sample store items (first 20) ===")
    local count = 0
    for _, item in pairs(g_storeManager:getItems()) do
        if item.xmlFilename ~= nil and count < 20 then
            print("[FarmCoop]   " .. item.xmlFilename)
            count = count + 1
        end
    end
    print("[FarmCoop] === End store items ===")
end

---
--- Lifecycle: called every frame with delta time in milliseconds
---
function FarmCoopMod:update(dt)
    if self.modSettingsDir == nil then
        return
    end

    self.timeSinceLastPoll = self.timeSinceLastPoll + dt

    if self.timeSinceLastPoll >= self.POLL_INTERVAL_MS then
        self.timeSinceLastPoll = 0
        self:processTransactions()
    end
end

---
--- Read and process the pending transactions XML file
---
function FarmCoopMod:processTransactions()
    local filePath = self.modSettingsDir .. "/" .. self.TRANSACTIONS_FILE

    -- Try to load as XML — if the file doesn't exist, XMLFile.load returns nil
    local xmlFile = XMLFile.load("farmcoop_transactions", filePath)
    if xmlFile == nil then
        return  -- No file = no pending work
    end

    local i = 0
    local processedCount = 0

    while true do
        local key = string.format("transactions.transaction(%d)", i)

        if not xmlFile:hasProperty(key) then
            break
        end

        local id = xmlFile:getString(key .. "#id", "")
        local txType = xmlFile:getString(key .. "#type", "")
        local farmId = xmlFile:getInt(key .. "#farmId", 0)

        -- Skip if already processed (prevents repeat execution)
        if self.processedIds[id] then
            -- Silently skip — no log spam
        elseif id ~= "" and txType ~= "" and farmId > 0 then
            if txType == "money" or txType == "wallet_withdrawal" then
                local amount = xmlFile:getInt(key .. "#amount", 0)
                self:processMoney(id, farmId, amount)
                processedCount = processedCount + 1
            elseif txType == "wallet_deposit" then
                local amount = xmlFile:getInt(key .. "#amount", 0)
                self:processWalletDeposit(id, farmId, amount)
                processedCount = processedCount + 1
            elseif txType == "equipment" then
                local equipmentId = xmlFile:getString(key .. "#equipmentId", "")
                self:processEquipment(id, farmId, equipmentId)
                processedCount = processedCount + 1
            else
                self:addConfirmation(id, false, "unknown_type: " .. txType)
            end

            -- Mark as processed so we never do it again
            self.processedIds[id] = true
        else
            print("[FarmCoop] Skipping invalid transaction at index " .. i)
        end

        i = i + 1
    end

    xmlFile:delete()

    if processedCount > 0 then
        print("[FarmCoop] Processed " .. processedCount .. " transaction(s)")
        self:writeConfirmations()
    end
end

---
--- Process a money transaction: add funds to the target farm
---
function FarmCoopMod:processMoney(id, farmId, amount)
    if amount <= 0 then
        self:addConfirmation(id, false, "invalid_amount")
        return
    end

    -- Verify the farm exists
    local farm = g_farmManager:getFarmById(farmId)
    if farm == nil then
        self:addConfirmation(id, false, "farm_not_found")
        return
    end

    -- Add money to the farm
    -- Parameters: amount, farmId, moneyType, addChange, showInStats
    g_currentMission:addMoney(amount, farmId, MoneyType.OTHER, true, true)

    print(string.format("[FarmCoop] Added $%d to Farm %d (tx: %s)", amount, farmId, id))
    self:addConfirmation(id, true)
end

---
--- Process a wallet deposit: remove funds from the in-game farm → web wallet
---
function FarmCoopMod:processWalletDeposit(id, farmId, amount)
    if amount <= 0 then
        self:addConfirmation(id, false, "invalid_amount")
        return
    end

    -- Verify the farm exists
    local farm = g_farmManager:getFarmById(farmId)
    if farm == nil then
        self:addConfirmation(id, false, "farm_not_found")
        return
    end

    -- Check the farm has enough money
    if farm.money < amount then
        print(string.format("[FarmCoop] Farm %d has $%d but deposit requires $%d", farmId, farm.money, amount))
        self:addConfirmation(id, false, "insufficient_funds")
        return
    end

    -- Remove money from the farm (negative amount)
    g_currentMission:addMoney(-amount, farmId, MoneyType.OTHER, true, true)

    print(string.format("[FarmCoop] Removed $%d from Farm %d for wallet deposit (tx: %s)", amount, farmId, id))
    self:addConfirmation(id, true)
end

---
--- Process an equipment transaction: spawn a vehicle for the target farm
---
function FarmCoopMod:processEquipment(id, farmId, equipmentId)
    if equipmentId == "" then
        self:addConfirmation(id, false, "missing_equipment_id")
        return
    end

    -- Verify the farm exists
    local farm = g_farmManager:getFarmById(farmId)
    if farm == nil then
        self:addConfirmation(id, false, "farm_not_found")
        return
    end

    -- Try to find the store item - try both with and without $data/ prefix
    local storeItem = g_storeManager:getItemByXMLFilename(equipmentId)
    if storeItem == nil then
        storeItem = g_storeManager:getItemByXMLFilename("$data/" .. equipmentId)
    end
    if storeItem == nil then
        -- Try searching by partial match
        local found = self:findStoreItemByPartialName(equipmentId)
        if found then
            equipmentId = found
            storeItem = g_storeManager:getItemByXMLFilename(found)
        end
    end

    if storeItem == nil then
        print("[FarmCoop] Store item not found for: " .. equipmentId)
        print("[FarmCoop] Use the store item paths from the log dump above")
        self:addConfirmation(id, false, "store_item_not_found")
        return
    end

    -- Get a spawn location
    local x, y, z = self:getSpawnPosition()

    if x == nil then
        self:addConfirmation(id, false, "no_spawn_position")
        return
    end

    -- Use the store item's actual xmlFilename for spawning
    local xmlPath = storeItem.xmlFilename
    print("[FarmCoop] Spawning vehicle: " .. xmlPath .. " for Farm " .. farmId)

    -- FS25 uses VehicleLoadingData instead of the old VehicleLoadingUtil
    local loadingData = VehicleLoadingData.new()
    loadingData:setStoreItem(storeItem)
    loadingData:setPosition(x, y, z)
    loadingData:setRotation(0, 0, 0)
    loadingData:setOwnerFarmId(farmId)
    loadingData:setPropertyState(VehiclePropertyState.OWNED)
    loadingData:setIsSaved(true)
    loadingData:setIsRegistered(true)
    loadingData:setAddToPhysics(true)

    local txId = id  -- capture for callback closure
    loadingData:load(
        function(target, vehicles, loadingState, args)
            if loadingState == VehicleLoadingState.OK then
                print("[FarmCoop] Vehicle loaded successfully: " .. xmlPath)
            else
                print("[FarmCoop] Vehicle load FAILED (state=" .. tostring(loadingState) .. "): " .. xmlPath)
            end
        end,
        self,
        {}
    )

    print(string.format("[FarmCoop] Spawn initiated for %s, Farm %d (tx: %s)", xmlPath, farmId, id))
    self:addConfirmation(id, true)
end

---
--- Search store items for a partial filename match
---
function FarmCoopMod:findStoreItemByPartialName(searchTerm)
    if g_storeManager == nil then return nil end

    local searchLower = string.lower(searchTerm)
    for _, item in pairs(g_storeManager:getItems()) do
        if item.xmlFilename ~= nil then
            local filenameLower = string.lower(item.xmlFilename)
            if string.find(filenameLower, searchLower) then
                return item.xmlFilename
            end
        end
    end
    return nil
end

---
--- Get a suitable spawn position for vehicles
---
function FarmCoopMod:getSpawnPosition()
    -- Try to get the shop spawn point
    if g_currentMission.storeSpawnPlaceable ~= nil then
        local x, y, z = getWorldTranslation(g_currentMission.storeSpawnPlaceable.rootNode)
        x = x + math.random(-5, 5)
        z = z + math.random(-5, 5)
        y = getTerrainHeightAtWorldPos(g_currentMission.terrainRootNode, x, 0, z)
        return x, y, z
    end

    -- Fallback: use a position near map center
    local mapSize = g_currentMission.mapWidth or 2048
    local x = mapSize / 2
    local z = mapSize / 2
    local y = getTerrainHeightAtWorldPos(g_currentMission.terrainRootNode, x, 0, z)
    return x, y, z
end

---
--- Add a confirmation entry to be written later
---
function FarmCoopMod:addConfirmation(id, success, errorMsg)
    table.insert(self.pendingConfirmations, {
        id = id,
        success = success,
        error = errorMsg
    })
end

---
--- Write all pending confirmations to the confirmations XML file
---
function FarmCoopMod:writeConfirmations()
    if #self.pendingConfirmations == 0 then
        return
    end

    local filePath = self.modSettingsDir .. "/" .. self.CONFIRMATIONS_FILE
    local xmlFile = XMLFile.create("farmcoop_confirmations", filePath, "confirmations")

    if xmlFile == nil then
        print("[FarmCoop] ERROR: Could not create confirmations file")
        return
    end

    for i, conf in ipairs(self.pendingConfirmations) do
        local key = string.format("confirmations.confirmation(%d)", i - 1)
        xmlFile:setString(key .. "#id", conf.id)
        xmlFile:setString(key .. "#success", tostring(conf.success))
        if conf.error then
            xmlFile:setString(key .. "#error", conf.error)
        end
    end

    xmlFile:save()
    xmlFile:delete()

    print("[FarmCoop] Wrote " .. #self.pendingConfirmations .. " confirmation(s)")
    self.pendingConfirmations = {}
end

---
--- Lifecycle: called when the mod is unloaded
---
function FarmCoopMod:deleteMap()
    self:writeConfirmations()
    print("[FarmCoop] Bridge mod unloaded")
end

-- Register the mod with the game's mission system
addModEventListener(FarmCoopMod)
