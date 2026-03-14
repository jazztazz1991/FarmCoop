-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "gameServerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessWallet" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessLedger" (
    "id" TEXT NOT NULL,
    "businessWalletId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanApplication" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "gameServerId" TEXT NOT NULL,
    "principal" BIGINT NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "denialReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessLoan" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "gameServerId" TEXT NOT NULL,
    "principal" BIGINT NOT NULL,
    "interestRate" INTEGER NOT NULL,
    "remainingBalance" BIGINT NOT NULL,
    "monthlyPayment" BIGINT NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "paymentsRemaining" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "nextPaymentDue" TIMESTAMP(3) NOT NULL,
    "disbursedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidOffAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealershipListing" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'equipment',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "costBasis" BIGINT NOT NULL DEFAULT 0,
    "pricePerUnit" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "buyerId" TEXT,
    "recipientFarmId" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealershipListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessPolicy" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "holderId" TEXT NOT NULL,
    "gameServerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "coverageAmount" BIGINT NOT NULL,
    "premium" BIGINT NOT NULL,
    "deductible" BIGINT NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "commodityId" TEXT,
    "commodityName" TEXT,
    "strikePrice" BIGINT,
    "equipmentId" TEXT,
    "equipmentName" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessClaim" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "claimAmount" BIGINT NOT NULL,
    "payout" BIGINT NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryContract" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "posterId" TEXT NOT NULL,
    "gameServerId" TEXT NOT NULL,
    "destinationFarmId" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "payout" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "acceptedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_ownerId_gameServerId_type_key" ON "Business"("ownerId", "gameServerId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessWallet_businessId_key" ON "BusinessWallet"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessLoan_applicationId_key" ON "BusinessLoan"("applicationId");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "GameServer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessWallet" ADD CONSTRAINT "BusinessWallet_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessLedger" ADD CONSTRAINT "BusinessLedger_businessWalletId_fkey" FOREIGN KEY ("businessWalletId") REFERENCES "BusinessWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessLoan" ADD CONSTRAINT "BusinessLoan_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessLoan" ADD CONSTRAINT "BusinessLoan_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessLoan" ADD CONSTRAINT "BusinessLoan_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealershipListing" ADD CONSTRAINT "DealershipListing_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealershipListing" ADD CONSTRAINT "DealershipListing_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPolicy" ADD CONSTRAINT "BusinessPolicy_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPolicy" ADD CONSTRAINT "BusinessPolicy_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClaim" ADD CONSTRAINT "BusinessClaim_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClaim" ADD CONSTRAINT "BusinessClaim_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "BusinessPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryContract" ADD CONSTRAINT "DeliveryContract_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryContract" ADD CONSTRAINT "DeliveryContract_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryContract" ADD CONSTRAINT "DeliveryContract_destinationFarmId_fkey" FOREIGN KEY ("destinationFarmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
