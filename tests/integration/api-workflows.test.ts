import assert from "node:assert/strict";
import test, { after, beforeEach } from "node:test";
import { Prisma, PrismaClient } from "@prisma/client";
import { POST as rejectRegistration } from "../../src/app/api/register/route";

const prisma = new PrismaClient();

beforeEach(async () => {
  await prisma.inventoryEvent.deleteMany();
  await prisma.item.deleteMany();
  await prisma.frame.deleteMany();
  await prisma.pairingSession.deleteMany();
  await prisma.user.deleteMany();
});

after(async () => {
  await prisma.$disconnect();
});

test("public registration remains forbidden", async () => {
  const response = await rejectRegistration();
  assert.equal(response.status, 403);
});

test("duplicate barcodes are rejected by the isolated database", async () => {
  const frame = await prisma.frame.create({
    data: { manufacturer: "Test", style: "One", color: "Black" },
  });
  await prisma.item.create({ data: { frameId: frame.id, barcode: "DUP-1" } });
  await assert.rejects(
    prisma.item.create({ data: { frameId: frame.id, barcode: "DUP-1" } }),
    (error) =>
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
  );
});

test("sale and unsale transitions keep audit fields consistent", async () => {
  const user = await prisma.user.create({ data: { username: "seller" } });
  const frame = await prisma.frame.create({
    data: { manufacturer: "Test", style: "Sale", color: "Blue" },
  });
  const item = await prisma.item.create({ data: { frameId: frame.id } });
  const sold = await prisma.item.update({
    where: { id: item.id },
    data: {
      status: "SOLD",
      soldAt: new Date(),
      soldPrice: 99,
      soldById: user.id,
    },
  });
  assert.equal(sold.status, "SOLD");
  assert.equal(sold.soldById, user.id);
  const unsold = await prisma.item.update({
    where: { id: item.id },
    data: { status: "IN_STOCK", soldAt: null, soldPrice: null, soldById: null },
  });
  assert.deepEqual(
    [unsold.status, unsold.soldAt, unsold.soldPrice, unsold.soldById],
    ["IN_STOCK", null, null, null]
  );
});

test("expired pairings and deletion snapshots persist correctly", async () => {
  const expired = await prisma.pairingSession.create({
    data: { code: "EXPIRED", expiresAt: new Date(Date.now() - 1_000) },
  });
  assert.equal(expired.expiresAt.getTime() < Date.now(), true);

  const frame = await prisma.frame.create({
    data: { manufacturer: "Audit", style: "Delete", color: "Red" },
  });
  const item = await prisma.item.create({
    data: { frameId: frame.id, barcode: "AUDIT-1" },
  });
  await prisma.$transaction(async (tx) => {
    await tx.inventoryEvent.create({
      data: {
        kind: "ITEM_DELETED",
        frameId: frame.id,
        itemId: item.id,
        barcode: item.barcode,
      },
    });
    await tx.item.delete({ where: { id: item.id } });
  });
  assert.equal(await prisma.item.count({ where: { id: item.id } }), 0);
  assert.equal(
    await prisma.inventoryEvent.count({ where: { itemId: item.id } }),
    1
  );
});
