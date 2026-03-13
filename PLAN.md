# FarmCoop Platform Plan

## Context

FarmCoop is a platform for Farming Simulator 25 communities — a modern alternative to farmsimulator.network (FSN NextGen). Our **proven standout feature**: a web-to-game bridge that delivers money and equipment to in-game farms through the website, without the sender joining that server. The POC is complete and working on both local and G-Portal hosted servers.

**Decisions made**: Single community focus first. Discord OAuth. PostgreSQL. MVP includes profiles, P2P transfers, marketplace, and wallet.

---

## POC Status (COMPLETE)

All working: Next.js API + Bridge (local & FTP) + FS25 Lua Mod. Money transfers and vehicle spawning confirmed end-to-end. 44 tests passing. Transport abstraction supports local filesystem and FTP for hosted servers.

---

## Architecture (Production)

```text
[Landing Page] → [Discord OAuth] → [Dashboard]
                                        ↓
                               [Next.js API (PostgreSQL)]
                                        ↕
                               [Bridge Service per server]
                                   ↕ local / FTP
                               [FS25 Lua Mod]
```

---

## Phase 1: Foundation + Auth + Profiles

### 1.1 PostgreSQL Migration

- Update `prisma/schema.prisma` provider from `sqlite` to `postgresql`
- Add DATABASE_URL for PostgreSQL (local dev via Docker or Railway)
- Run `prisma migrate dev` to regenerate

### 1.2 Prisma Schema — New Models

```prisma
model User {
  id          String   @id @default(cuid())
  discordId   String   @unique
  displayName String
  avatarUrl   String?
  role        String   @default("member") // member | admin
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  farms       Farm[]
  wallet      Wallet?
  sessions    Session[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model GameServer {
  id              String   @id @default(cuid())
  name            String
  transportType   String   // "local" | "ftp"
  transportConfig Json     // FTP creds or local path (encrypted at rest)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  farms           Farm[]
}

model Farm {
  id           String     @id @default(cuid())
  gameServerId String
  gameServer   GameServer @relation(fields: [gameServerId], references: [id])
  userId       String
  user         User       @relation(fields: [userId], references: [id])
  farmSlot     Int        // 1-16 in FS25
  name         String
  createdAt    DateTime   @default(now())
  @@unique([gameServerId, farmSlot])
}

model Wallet {
  id        String         @id @default(cuid())
  userId    String         @unique
  user      User           @relation(fields: [userId], references: [id])
  balance   BigInt         @default(0)
  updatedAt DateTime       @updatedAt
  ledger    WalletLedger[]
}

model WalletLedger {
  id          String   @id @default(cuid())
  walletId    String
  wallet      Wallet   @relation(fields: [walletId], references: [id])
  amount      BigInt   // positive = credit, negative = debit
  type        String   // deposit | withdrawal | transfer_in | transfer_out | sale | purchase
  referenceId String?  // links to transaction, listing, etc.
  description String
  createdAt   DateTime @default(now())
}

// Evolve existing Transaction model
model Transaction {
  id               String    @id @default(cuid())
  type             String    // money | equipment
  amount           Int?
  equipmentId      String?
  status           String    @default("pending")
  senderId         String
  recipientFarmId  String    // references Farm.id
  gameServerId     String
  farmSlot         Int
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  bridgePickedUpAt DateTime?
  deliveredAt      DateTime?
  confirmedAt      DateTime?
}
```

### 1.3 Auth Domain Module

```text
src/domain/auth/
  auth.model.ts          — User, Session, AuthResult types
  auth.service.ts        — handleDiscordCallback, validateSession, logout
  auth.repository.ts     — user + session CRUD
  __tests__/auth.service.test.ts
```

```text
src/lib/discord.ts       — OAuth2 token exchange + user info fetch
src/lib/session.ts       — cookie-based session middleware
```

**API Routes:**

```text
src/app/api/auth/discord/route.ts            — GET: redirect to Discord OAuth
src/app/api/auth/discord/callback/route.ts   — GET: handle callback, create user+session, set cookie
src/app/api/auth/logout/route.ts             — POST: destroy session
src/app/api/auth/me/route.ts                 — GET: current user DTO
```

**Key**: Bridge service keeps `x-api-key` auth. User-facing routes use session cookies. `src/lib/auth.ts` checks either.

### 1.4 User Domain Module

```text
src/domain/user/
  user.model.ts          — UserDTO (id, displayName, avatarUrl, role)
  user.service.ts        — getProfile, updateDisplayName
  user.repository.ts
  __tests__/user.service.test.ts
```

**API Routes:**

```text
src/app/api/users/me/route.ts               — GET/PATCH own profile
```

### 1.5 Server + Farm Domain Modules

```text
src/domain/server/
  server.model.ts        — GameServer, GameServerDTO
  server.service.ts      — registerServer, listServers (admin)
  server.repository.ts
  server.validator.ts
  __tests__/server.service.test.ts

src/domain/farm/
  farm.model.ts          — Farm, FarmDTO, ClaimFarmInput
  farm.service.ts        — claimFarm, releaseFarm, getMyFarms
  farm.repository.ts
  farm.validator.ts
  __tests__/farm.service.test.ts
```

**API Routes:**

```text
src/app/api/servers/route.ts                 — GET list
src/app/api/servers/[id]/farms/route.ts      — GET farms for server
src/app/api/servers/[id]/farms/claim/route.ts — POST claim a slot
src/app/api/servers/[id]/farms/release/route.ts — POST release a slot
```

### 1.6 Refactor Transaction Module

Update `src/domain/transaction/` to be user-aware:

- Transactions now have `senderId` and `recipientFarmId`
- Validation ensures sender has a wallet with sufficient balance (for marketplace)
- Bridge polls per `gameServerId`

### 1.7 UI — Dashboard Shell

**Pages:**

```text
src/app/page.tsx                              — Landing page (unauthenticated)
src/app/login/page.tsx                        — Discord login button
src/app/dashboard/layout.tsx                  — Auth guard + sidebar + header
src/app/dashboard/page.tsx                    — Overview: my farms, wallet balance, recent activity
src/app/dashboard/send/page.tsx               — Send money/equipment form
src/app/dashboard/transactions/page.tsx       — Full transaction history
src/app/dashboard/farms/page.tsx              — My farms + claim new
```

**Components (presentational only):**

```text
src/components/layout/Sidebar.tsx
src/components/layout/Header.tsx
src/components/dashboard/FarmCard.tsx
src/components/dashboard/WalletCard.tsx
src/components/dashboard/TransactionTable.tsx
src/components/dashboard/SendForm.tsx
src/components/dashboard/StatusBadge.tsx
```

**View models (decisions + derived state):**

```text
src/viewmodels/useDashboard.ts
src/viewmodels/useSendTransaction.ts
src/viewmodels/useTransactionHistory.ts
```

### 1.8 E2E Tests

```text
e2e/auth.spec.ts                — Discord login flow (mocked OAuth)
e2e/dashboard.spec.ts           — Dashboard loads, shows farms
e2e/send-transaction.spec.ts    — Full send flow
```

---

## Phase 2: Wallet + Marketplace

### 2.1 Wallet Domain Module

```text
src/domain/wallet/
  wallet.model.ts        — Wallet, WalletLedger, BalanceDTO
  wallet.service.ts      — getBalance, deposit, withdraw, transfer
  wallet.repository.ts   — all operations in DB transactions for consistency
  wallet.validator.ts
  __tests__/wallet.service.test.ts
```

**API Routes:**

```text
src/app/api/wallet/route.ts                  — GET balance
src/app/api/wallet/deposit/route.ts          — POST deposit (triggers bridge to pull money from game)
src/app/api/wallet/withdraw/route.ts         — POST withdraw (triggers bridge to send money to game)
src/app/api/wallet/ledger/route.ts           — GET transaction history
```

**Key design**: Every money movement goes through the wallet ledger. Deposit = bridge pulls money from game farm. Withdraw = bridge sends money to game farm. Transfer = wallet-to-wallet (instant, no bridge needed).

### 2.2 Marketplace Domain Module

```text
src/domain/marketplace/
  listing.model.ts       — Listing, ListingDTO, CreateListingInput
  listing.service.ts     — createListing, buyListing, cancelListing, searchListings
  listing.repository.ts
  listing.validator.ts
  __tests__/listing.service.test.ts
```

**Prisma model:**

```prisma
model Listing {
  id           String    @id @default(cuid())
  sellerId     String
  type         String    // equipment | commodity
  itemId       String    // equipment catalog ID or commodity type
  itemName     String
  quantity     Int       @default(1)
  pricePerUnit BigInt
  status       String    @default("active") // active | sold | cancelled | expired
  expiresAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

**API Routes:**

```text
src/app/api/marketplace/listings/route.ts           — GET search, POST create
src/app/api/marketplace/listings/[id]/route.ts      — GET detail, DELETE cancel
src/app/api/marketplace/listings/[id]/buy/route.ts  — POST purchase
```

**Buy flow**: Buyer's wallet debited -> Seller's wallet credited -> Bridge delivers equipment to buyer's farm.

**UI Pages:**

```text
src/app/dashboard/marketplace/page.tsx               — Browse/search listings
src/app/dashboard/marketplace/sell/page.tsx           — Create listing
src/app/dashboard/marketplace/my-listings/page.tsx    — My listings
src/app/dashboard/wallet/page.tsx                     — Wallet balance + ledger
```

### 2.3 Notification System

```text
src/domain/notification/
  notification.model.ts
  notification.service.ts
  notification.repository.ts
  channels/
    in-app.ts            — DB-backed in-app notifications
    discord-webhook.ts   — Optional Discord DM/channel notifications
```

---

## Phase 3: Economy + Businesses (Future)

- **Price engine**: Supply/demand-based commodity pricing
- **Businesses**: Player-owned dealerships, processors, transport companies
- **Contracts**: "Deliver 10t wheat to X for $Y" job board
- **Land/Property**: Auctions, leasing, property taxes

---

## Phase 4: Community + Social (Future)

- **Events**: Monthly auctions, harvest competitions
- **Careers/Roles**: Farmer, trucker, inspector, dealer
- **Leaderboards**: Richest, most productive, biggest business
- **Federation**: Optional cross-server shared economy

---

## Phase 5: Advanced (Future)

- **Production chains**: Raw -> factory -> finished goods
- **Banking**: Player-owned banks, loans, savings, CDs
- **Insurance**: Crop, vehicle, liability
- **Breeding**: Horse genetics system

---

## What Makes FarmCoop Better Than FSN

1. **Web-to-game bridge** — send money/equipment without joining the server (working now)
2. **Modern stack** — Next.js 16, React 19, TypeScript vs dated PHP. Fast, mobile-friendly
3. **Discord-native** — login, notifications, bot integration where the community lives
4. **Server-owner sovereignty** — self-host or cloud-host per community, not locked into one central platform
5. **Open architecture** — typed APIs, Zod schemas, clean domain layers. Easy to extend

---

## Build Order (Phase 1)

1. PostgreSQL migration
2. Discord OAuth + session auth
3. User profiles
4. Game server registration
5. Farm claiming
6. Transaction refactor (user-aware)
7. Wallet system (basic balance)
8. Bridge multi-server refactor
9. Dashboard UI shell (layout, sidebar, auth guard)
10. Dashboard pages (overview, send, history, farms)
11. E2E tests



Phase 3: Economy + Businesses — FUTURE

Price engine (supply/demand commodity pricing)
Businesses (player-owned dealerships, processors, transport companies)
Contracts (job board: "deliver 10t wheat for $Y")
Land/Property (auctions, leasing, property taxes)


Phase 4: Community + Social — FUTURE

Events (monthly auctions, harvest competitions)
Careers/Roles (farmer, trucker, inspector, dealer)
Leaderboards (richest, most productive)
Federation (cross-server shared economy)


Phase 5: Advanced — FUTURE

Production chains (raw → factory → finished goods)
Banking (loans, savings, CDs)
Insurance (crop, vehicle, liability)
Breeding (horse genetics)
---

## Verification

- All 44+ existing tests continue to pass after each step
- New domain modules have unit tests before implementation
- Discord OAuth tested with real Discord app (dev credentials)
- Bridge continues to work in both local and FTP modes
- E2E Playwright tests cover: login -> dashboard -> send transaction -> verify status
- Manual test: send money from web dashboard to in-game farm on G-Portal server
