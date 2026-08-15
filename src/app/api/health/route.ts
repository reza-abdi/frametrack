import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { logServerError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = randomUUID();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } }
    );
  } catch (error) {
    logServerError("health.database_unavailable", error, { requestId });
    return NextResponse.json(
      { status: "degraded", timestamp: new Date().toISOString() },
      {
        status: 503,
        headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
      }
    );
  }
}
