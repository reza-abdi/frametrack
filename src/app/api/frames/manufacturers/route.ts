import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.frame.findMany({
    select: { manufacturer: true },
    distinct: ["manufacturer"],
  });

  const seen = new Map<string, string>();
  for (const r of rows) {
    seen.set(r.manufacturer.toLowerCase(), r.manufacturer);
  }

  const merged = Array.from(seen.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  return NextResponse.json(merged);
}
