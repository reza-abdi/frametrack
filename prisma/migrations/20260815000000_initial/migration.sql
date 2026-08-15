-- Initial reviewed baseline for new databases.
-- Existing databases previously managed with `prisma db push` must be
-- baselined with `prisma migrate resolve --applied 20260815000000_initial`.

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "name" TEXT,
    "password" TEXT,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Frame" (
    "id" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retailCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "size" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "Frame_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "barcode" TEXT,
    "frameId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "soldAt" TIMESTAMP(3),
    "soldPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "soldById" TEXT,
    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PairingSession" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lastBarcode" TEXT,
    "lastBarcodeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PairingSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryEvent" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "frameId" TEXT,
    "itemId" TEXT,
    "manufacturer" TEXT,
    "style" TEXT,
    "color" TEXT,
    "description" TEXT,
    "barcode" TEXT,
    "itemStatus" TEXT,
    "inStockCount" INTEGER,
    "soldCount" INTEGER,
    CONSTRAINT "InventoryEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "Frame_manufacturer_idx" ON "Frame"("manufacturer");
CREATE INDEX "Frame_description_idx" ON "Frame"("description");
CREATE UNIQUE INDEX "Item_barcode_key" ON "Item"("barcode");
CREATE INDEX "Item_frameId_idx" ON "Item"("frameId");
CREATE INDEX "Item_status_idx" ON "Item"("status");
CREATE UNIQUE INDEX "PairingSession_code_key" ON "PairingSession"("code");
CREATE INDEX "PairingSession_expiresAt_idx" ON "PairingSession"("expiresAt");
CREATE INDEX "InventoryEvent_occurredAt_idx" ON "InventoryEvent"("occurredAt");
CREATE INDEX "InventoryEvent_kind_idx" ON "InventoryEvent"("kind");

ALTER TABLE "Frame" ADD CONSTRAINT "Frame_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "Frame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_soldById_fkey" FOREIGN KEY ("soldById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryEvent" ADD CONSTRAINT "InventoryEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
