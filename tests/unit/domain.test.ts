import assert from "node:assert/strict";
import test from "node:test";
import { csvCell, parseDateParam, toCsvRow } from "../../src/lib/csv";
import { defaultSortDir, isFrameSortField } from "../../src/lib/frame-sort";
import {
  buildTrend,
  computePeriodStats,
  wasInStockAt,
} from "../../src/lib/inventory-stats";
import {
  normalizeLabel,
  pickKnownCanonical,
  toDisplayCase,
} from "../../src/lib/normalize-label";
import { generatePairingCode, PAIRING_TTL_MS } from "../../src/lib/pairing";

test("label normalization preserves canonical spelling", () => {
  const known = ["Ray-Ban", "Tiffany & Co."];
  assert.equal(pickKnownCanonical(" ray-ban ", known), "Ray-Ban");
  assert.equal(normalizeLabel("RAY-BAN", known), "Ray-Ban");
  assert.equal(toDisplayCase("matte black/green"), "Matte Black/Green");
});

test("frame sorting accepts only supported fields", () => {
  assert.equal(isFrameSortField("manufacturer"), true);
  assert.equal(isFrameSortField("password"), false);
  assert.equal(defaultSortDir("createdAt"), "desc");
  assert.equal(defaultSortDir("cost"), "asc");
});

test("CSV escaping and date parsing handle boundary input", () => {
  assert.equal(csvCell('a,"b"\nline'), '"a,""b""\nline"');
  assert.equal(toCsvRow(["safe", null, 12]), "safe,,12");
  assert.equal(parseDateParam("2024-02-31", false), null);
  assert.equal(
    parseDateParam("2024-02-29", true)?.toISOString(),
    "2024-02-29T23:59:59.999Z"
  );
});

test("pairing codes use the unambiguous alphabet and configured TTL", () => {
  const codes = new Set(
    Array.from({ length: 40 }, () => generatePairingCode())
  );
  assert.equal(codes.size, 40);
  for (const code of codes) assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(PAIRING_TTL_MS, 30 * 60 * 1000);
});

test("inventory statistics include exact range boundaries", () => {
  const start = new Date("2026-01-01T00:00:00.000Z");
  const end = new Date("2026-01-02T23:59:59.999Z");
  const items = [
    { createdAt: start, soldAt: end, soldPrice: 50 },
    {
      createdAt: new Date("2026-01-02T12:00:00.000Z"),
      soldAt: null,
      soldPrice: null,
    },
  ];
  assert.equal(wasInStockAt(items[0], start), true);
  assert.deepEqual(computePeriodStats(items, start, end), {
    inventoryStart: 1,
    inventoryEnd: 1,
    added: 2,
    sold: 1,
    soldRevenue: 50,
    netExpected: 2,
    unaccounted: -1,
  });
  assert.deepEqual(
    buildTrend(items, start, end).map((point) => point.date),
    ["2026-01-01", "2026-01-02"]
  );
});
