# FarmCoop — Player-Run Business System

## Context

FarmCoop has a working economy (wallet, marketplace, banking, insurance, production, contracts) but all financial services are **system-operated** — loans auto-approve, insurance claims auto-evaluate, anyone can trade. The `career` field on User (farmer/trucker/dealer/inspector) is purely cosmetic.

**Goal**: Let players run real businesses. A banker career unlocks opening a bank. A dealer opens a dealership. An inspector runs an insurance company. A trucker runs a hauling business. Businesses have their own wallets, custom pricing, and manual approval flows. Other players interact with these businesses as customers.

**Design**: Hybrid model — career gates the ability to create a business type, business entity handles the economics. Existing auto-approve systems remain untouched as the "system" fallback. Web-side only — game integration is limited to bridge delivery transactions.

---

## Phase 1: Foundation (Business Core + Wallet)

### 1.1 New Prisma Models

Add to `prisma/schema.prisma`:

**Business** — the core entity
```
Business: id, ownerId→User, gameServerId→GameServer, type (bank|dealership|insurance|trucking),
  name, description, status (active|suspended|closed), settings (Json - custom rates/fees)
  @@unique([ownerId, gameServerId, type])  — one of each type per server per owner
```

**BusinessWallet** — separate from personal Wallet
```
BusinessWallet: id, businessId→Business (unique), balance (BigInt)
BusinessLedger: id, businessWalletId→BusinessWallet, amount (BigInt), type, referenceId, description
```

Add relations on User (`businesses Business[]`) and GameServer (`businesses Business[]`).

### 1.2 Domain Module: `src/domain/business/`

```
src/domain/business/
  business.model.ts      — BusinessDTO, BusinessWalletDTO, BusinessLedgerEntryDTO, BusinessType, BusinessSettings
  business.validator.ts  — createBusinessSchema, updateSettingsSchema, walletTransferSchema
  business.engine.ts     — canCreateBusiness(career, type): boolean, getCareerForType(type): Career
  business.repository.ts — CRUD + wallet operations (atomic balance + ledger via $transaction)
  business.service.ts    — createBusiness, getMyBusinesses, getBusiness, updateSettings, closeBusiness,
                           depositToBusinessWallet, withdrawFromBusinessWallet, getBusinessWallet
  __tests__/             — Unit tests for engine + service
```

**Career → Business mapping** (in `business.engine.ts`):
- `banker` → `bank`
- `dealer` → `dealership`
- `inspector` → `insurance`
- `trucker` → `trucking`

### 1.3 API Routes

```
POST   /api/businesses                    — Create business (career-gated)
GET    /api/businesses?type=&serverId=    — Browse businesses (filterable)
GET    /api/businesses/mine               — My owned businesses
GET    /api/businesses/[id]               — Business detail
PATCH  /api/businesses/[id]               — Update settings
GET    /api/businesses/[id]/wallet        — Business wallet + recent ledger
POST   /api/businesses/[id]/wallet/deposit   — Owner deposits personal→business
POST   /api/businesses/[id]/wallet/withdraw  — Owner withdraws business→personal
```

All use `withAuth`. Business owner checks in service layer.

### 1.4 Dashboard Pages

```
/dashboard/businesses              — Browse all businesses (filter by type/server)
/dashboard/businesses/create       — Create form (career-gated, shows which types you can create)
/dashboard/businesses/mine         — My businesses list
/dashboard/businesses/[id]         — Owner dashboard (wallet, settings, type-specific tabs)
```

### 1.5 Components

- `BusinessCard.tsx` — name, type icon, owner, status badge
- `BusinessWalletCard.tsx` — balance, deposit/withdraw buttons

### 1.6 Sidebar Update

Add "Businesses" nav item in `src/components/layout/Sidebar.tsx`.

### 1.7 New Ledger Types

Add to `LedgerType` in `src/domain/wallet/wallet.model.ts`:
- `business_wallet_deposit` / `business_wallet_withdrawal`

### 1.8 Tests

- Unit: `business.engine.test.ts` (career gating), `business.service.test.ts` (CRUD, wallet ops)
- RTL: `BusinessCard.test.tsx`, `BusinessWalletCard.test.tsx`
- E2E: `businesses.spec.ts` (browse, create, deposit)

---

## Phase 2: Player-Run Bank

### 2.1 New Prisma Models

```
LoanApplication: id, businessId→Business, applicantId→User, gameServerId, principal (BigInt),
  termMonths, status (pending|approved|denied), denialReason, reviewedAt

BusinessLoan: id, businessId→Business, applicationId→LoanApplication (unique), borrowerId→User,
  gameServerId, principal, interestRate (basis points), remainingBalance, monthlyPayment,
  termMonths, paymentsRemaining, status (active|paid_off|defaulted), nextPaymentDue
```

Add relations on User (`loanApplications`, `businessLoans`).

### 2.2 Domain: `src/domain/business/bank/`

```
bank.model.ts       — LoanApplicationDTO, BusinessLoanDTO, BankSettings (interestRateBp, maxLoanAmount)
bank.validator.ts   — applyForLoanSchema, reviewApplicationSchema
bank.engine.ts      — Re-imports calculateMonthlyPayment from banking.engine.ts (no duplication)
bank.repository.ts  — Atomic: approve (debit business wallet → credit borrower) / deny / pay
bank.service.ts     — applyForLoan, getApplications, reviewApplication, getLoans, makePayment
__tests__/          — Tests: apply, approve/deny, payment, insufficient funds
```

**Key flows**:
- **Apply**: Borrower submits application → status=pending → bank owner notified
- **Approve**: Owner reviews → atomic: BusinessWallet debited, borrower Wallet credited, BusinessLoan created
- **Deny**: Owner sets reason → status=denied, applicant notified
- **Payment**: Borrower pays → atomic: borrower Wallet debited, BusinessWallet credited (principal+interest split)
- **Insufficient business funds**: Approval fails with clear error — bank must have funds to lend

### 2.3 API Routes

```
POST   /api/businesses/[id]/loans/applications           — Apply for loan from this bank
GET    /api/businesses/[id]/loans/applications           — Pending applications (owner only)
POST   /api/businesses/[id]/loans/applications/[appId]/review — Approve/deny (owner only)
GET    /api/businesses/[id]/loans                        — Active loans (owner sees all, borrower sees theirs)
POST   /api/businesses/[id]/loans/[loanId]/pay           — Make payment (borrower)
```

### 2.4 Dashboard Pages

```
/dashboard/businesses/banks                — Browse player-run banks
/dashboard/businesses/banks/[id]/apply     — Loan application form (shows bank's rates)
/dashboard/businesses/[id]                 — Bank owner dashboard: pending apps, active loans, wallet
```

### 2.5 Components + Tests

- `LoanApplicationCard.tsx` — shows applicant, amount, term, approve/deny buttons (owner view)
- `BusinessLoanCard.tsx` — loan details, payment button (borrower view)
- Unit tests, RTL tests, E2E test: `business-bank.spec.ts`

---

## Phase 3: Player-Run Dealership

### 3.1 New Prisma Model

```
DealershipListing: id, businessId→Business, itemId, itemName, category (equipment|commodity),
  quantity, costBasis (BigInt), pricePerUnit (BigInt), status (active|sold|cancelled),
  buyerId→User, recipientFarmId, transactionId
```

Add relation on User (`dealershipPurchases`).

### 3.2 Domain: `src/domain/business/dealership/`

```
dealership.model.ts      — DealershipListingDTO, DealershipSettings
dealership.validator.ts  — addInventorySchema, purchaseSchema (includes farmId for delivery)
dealership.repository.ts — Atomic buy: debit buyer, credit business, mark sold, create Transaction
dealership.service.ts    — addItem, removeItem, updatePrice, getInventory, purchaseItem, browseDealerships
__tests__/               — Tests: add inventory, purchase with farm delivery, insufficient funds
```

**Key flow**:
- **Purchase**: Buyer selects item + destination farm → atomic: buyer Wallet debited, BusinessWallet credited, listing marked sold, bridge `Transaction` created (type: `equipment`, recipientFarmId, gameServerId, equipmentId from listing)
- **Bridge integration**: Reuses existing `Transaction` model — the bridge picks it up like any other equipment delivery
- **Owner sees**: which server/farm the buyer selected for delivery

### 3.3 API Routes

```
GET    /api/businesses/[id]/inventory              — Browse dealership inventory
POST   /api/businesses/[id]/inventory              — Add item (owner only)
PATCH  /api/businesses/[id]/inventory/[itemId]      — Update price (owner only)
DELETE /api/businesses/[id]/inventory/[itemId]       — Remove item (owner only)
POST   /api/businesses/[id]/inventory/[itemId]/buy  — Purchase + select farm for delivery
GET    /api/businesses/dealerships?serverId=         — Browse all dealerships on a server
```

### 3.4 Dashboard Pages

```
/dashboard/businesses/dealerships              — Browse dealerships
/dashboard/businesses/dealerships/[id]         — Dealership storefront (inventory + buy buttons)
/dashboard/businesses/[id]                     — Dealer owner: manage inventory, sales history
```

### 3.5 Components + Tests

- `DealershipItemCard.tsx` — item name, price, buy button (customer) / edit/remove (owner)
- Unit tests, RTL tests, E2E test: `business-dealership.spec.ts`

---

## Phase 4: Player-Run Insurance Company

### 4.1 New Prisma Models

```
BusinessPolicy: id, businessId→Business, holderId→User, gameServerId, type (crop|vehicle|liability),
  coverageAmount, premium, deductible, status (active|expired|claimed|cancelled),
  commodityId, commodityName, strikePrice, equipmentId, equipmentName, startsAt, expiresAt

BusinessClaim: id, businessId→Business, policyId→BusinessPolicy, claimAmount, payout,
  reason, status (pending|approved|denied), resolvedAt
```

Add relations on User (`businessPolicies`).

### 4.2 Domain: `src/domain/business/insurance-co/`

```
insurance-co.model.ts      — BusinessPolicyDTO, BusinessClaimDTO, InsuranceCoSettings (riskRates, maxCoverage)
insurance-co.validator.ts  — purchasePolicySchema, fileClaimSchema, reviewClaimSchema
insurance-co.engine.ts     — Re-imports from insurance.engine.ts, applies custom risk rates from settings
insurance-co.repository.ts — Atomic: premium payment, claim payout
insurance-co.service.ts    — purchasePolicy, fileClaim, getClaimsForReview, reviewClaim, suggestPayout
__tests__/                 — Tests: purchase, file claim, approve/deny, insufficient business funds
```

**Key flows**:
- **Purchase**: Customer pays premium → atomic: customer Wallet debited, BusinessWallet credited
- **File claim**: Customer submits claim → status=pending → owner notified
- **Review**: Owner approves → atomic: BusinessWallet debited, customer Wallet credited. If business wallet insufficient → cannot approve (real risk!)
- **Deny**: Owner sets reason → no money moves
- **suggestPayout**: Pure function helper showing calculated payout (non-binding, helps owner decide)

### 4.3 API Routes

```
GET    /api/businesses/[id]/policies                     — Policies issued (owner: all, customer: theirs)
POST   /api/businesses/[id]/policies                     — Buy policy from this insurer
POST   /api/businesses/[id]/policies/[policyId]/claim    — File claim
GET    /api/businesses/[id]/claims                       — Pending claims (owner only)
POST   /api/businesses/[id]/claims/[claimId]/review      — Approve/deny (owner only)
GET    /api/businesses/insurers?serverId=                 — Browse all insurers on a server
```

### 4.4 Dashboard Pages

```
/dashboard/businesses/insurers              — Browse insurance companies
/dashboard/businesses/insurers/[id]         — View rates, buy policy
/dashboard/businesses/[id]                  — Insurer owner: pending claims, policies, wallet
```

### 4.5 Components + Tests

- `BusinessPolicyCard.tsx` — type, coverage, premium, file claim button
- `BusinessClaimCard.tsx` — claim details, approve/deny buttons (owner), status badge (customer)
- Unit tests, RTL tests, E2E test: `business-insurance.spec.ts`

---

## Phase 5: Player-Run Trucking Company

### 5.1 New Prisma Model

```
DeliveryContract: id, businessId→Business, posterId→User, gameServerId,
  destinationFarmId→Farm, itemDescription, payout (BigInt, escrowed on creation),
  status (open|accepted|in_transit|delivered|completed|cancelled),
  acceptedAt, deliveredAt, completedAt
```

Add relations on User (`deliveryContractsPoster`) and Farm (`deliveryContracts`).

### 5.2 Domain: `src/domain/business/trucking/`

```
trucking.model.ts      — DeliveryContractDTO (includes server name, farm name, farm slot for trucker)
trucking.validator.ts  — postDeliverySchema, acceptSchema, confirmSchema
trucking.repository.ts — Atomic: escrow on post, release on completion, refund on cancel
trucking.service.ts    — postDeliveryRequest, acceptDelivery, markDelivered, confirmDelivery, cancelDelivery
__tests__/             — Tests: full lifecycle, escrow, cancellation refund
```

**Key flows**:
- **Post request**: Any user posts delivery job with payout → funds escrowed from poster's Wallet
- **Accept**: Trucking owner accepts → status=accepted, owner sees destination server + farm name + slot
- **Deliver**: Trucking owner marks delivered (they did the in-game action)
- **Confirm**: Poster confirms receipt → escrow released to BusinessWallet
- **Cancel**: If not yet accepted → refund poster. If accepted but stale → configurable timeout

### 5.3 API Routes

```
POST   /api/businesses/[id]/deliveries                        — Post delivery request (any user)
GET    /api/businesses/[id]/deliveries                        — Open deliveries (owner: all, poster: theirs)
POST   /api/businesses/[id]/deliveries/[deliveryId]/accept    — Accept (owner only)
POST   /api/businesses/[id]/deliveries/[deliveryId]/deliver   — Mark delivered (owner only)
POST   /api/businesses/[id]/deliveries/[deliveryId]/confirm   — Confirm receipt (poster only)
POST   /api/businesses/[id]/deliveries/[deliveryId]/cancel    — Cancel (poster if not accepted, owner if accepted)
GET    /api/businesses/trucking?serverId=                      — Browse trucking companies on a server
```

### 5.4 Dashboard Pages

```
/dashboard/businesses/trucking                  — Browse trucking companies
/dashboard/businesses/trucking/[id]/request     — Post delivery request form
/dashboard/businesses/[id]                      — Trucker owner: open jobs, destination info, wallet
```

### 5.5 Components + Tests

- `DeliveryContractCard.tsx` — item, payout, destination (server/farm/slot), status, action buttons
- Unit tests, RTL tests, E2E test: `business-trucking.spec.ts`

---

## Phase 6: Notifications + Polish

- Add notification types: `loan_application_received`, `loan_application_approved`, `loan_application_denied`, `business_loan_payment`, `dealership_sale`, `insurance_claim_filed`, `insurance_claim_resolved`, `delivery_request_posted`, `delivery_accepted`, `delivery_confirmed`
- Add to `NotificationType` in `src/domain/notification/notification.model.ts`
- Fire notifications in all business services (fire-and-forget pattern)
- Business browse pages: search/filter UI, sorted by ratings or activity

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add 8 new models + relations on User, GameServer, Farm |
| `src/domain/wallet/wallet.model.ts` | Add new LedgerType values |
| `src/domain/notification/notification.model.ts` | Add new NotificationType values |
| `src/components/layout/Sidebar.tsx` | Add "Businesses" nav item |
| `src/domain/banking/banking.engine.ts` | **No changes** — re-imported by bank subdomain |
| `src/domain/insurance/insurance.engine.ts` | **No changes** — re-imported by insurance-co subdomain |

## Files to Create (by phase)

| Phase | New Files |
|-------|-----------|
| 1 | 7 domain files + 2 components + 6 API routes + 4 pages + tests |
| 2 | 6 domain files + 2 components + 5 API routes + 3 pages + tests |
| 3 | 5 domain files + 1 component + 6 API routes + 3 pages + tests |
| 4 | 6 domain files + 2 components + 5 API routes + 3 pages + tests |
| 5 | 5 domain files + 1 component + 6 API routes + 3 pages + tests |

## Coexistence with Existing Systems

**The existing auto-approve systems remain untouched:**
- System bank (`/dashboard/banking`) — auto-approved loans at 5%, unlimited funds
- System insurance (`/dashboard/insurance`) — auto-evaluated claims
- System marketplace (`/dashboard/marketplace`) — P2P listings
- System contracts (`/dashboard/contracts`) — P2P escrow contracts

Player-run businesses are a **parallel opt-in alternative** accessed through `/dashboard/businesses/*`. No existing code is modified except adding sidebar nav, new ledger types, and new notification types.

## Verification

- All 424 existing tests continue passing (no existing code modified)
- New unit tests for each business domain module
- New RTL tests for each new component
- New E2E tests for each business type flow
- Manual: create business → deposit funds → customer interacts → verify wallet balances
- Career gating: verify wrong career cannot create business type
- Insufficient funds: verify business operations fail gracefully when wallet is empty
- `npm run build` passes after each phase
