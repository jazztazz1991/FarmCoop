-- CreateTable
CREATE TABLE "CommodityPrice" (
    "id" TEXT NOT NULL,
    "gameServerId" TEXT NOT NULL,
    "commodityId" TEXT NOT NULL,
    "commodityName" TEXT NOT NULL,
    "basePrice" BIGINT NOT NULL,
    "currentPrice" BIGINT NOT NULL,
    "supply" INTEGER NOT NULL DEFAULT 0,
    "demand" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommodityPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "gameServerId" TEXT NOT NULL,
    "commodityId" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "supply" INTEGER NOT NULL,
    "demand" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "gameServerId" TEXT NOT NULL,
    "posterId" TEXT NOT NULL,
    "claimerId" TEXT,
    "commodityId" TEXT NOT NULL,
    "commodityName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerUnit" BIGINT NOT NULL,
    "totalPayout" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deliveryDeadline" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommodityPrice_gameServerId_commodityId_key" ON "CommodityPrice"("gameServerId", "commodityId");

-- CreateIndex
CREATE INDEX "PriceHistory_gameServerId_commodityId_recordedAt_idx" ON "PriceHistory"("gameServerId", "commodityId", "recordedAt");

-- AddForeignKey
ALTER TABLE "CommodityPrice" ADD CONSTRAINT "CommodityPrice_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "GameServer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "GameServer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_claimerId_fkey" FOREIGN KEY ("claimerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
