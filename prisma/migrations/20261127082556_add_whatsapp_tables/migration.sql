-- CreateTable
CREATE TABLE "WhatsappContact" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappInbound" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappInbound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappPendingAction" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "partial" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappPendingAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappContact_phone_key" ON "WhatsappContact"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappInbound_messageId_key" ON "WhatsappInbound"("messageId");

-- CreateIndex
CREATE INDEX "WhatsappInbound_phone_idx" ON "WhatsappInbound"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappPendingAction_phone_key" ON "WhatsappPendingAction"("phone");

-- AddForeignKey
ALTER TABLE "WhatsappContact" ADD CONSTRAINT "WhatsappContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

