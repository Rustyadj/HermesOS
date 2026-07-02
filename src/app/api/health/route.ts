import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch {
    return Response.json(
      { status: "degraded", db: "disconnected", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
