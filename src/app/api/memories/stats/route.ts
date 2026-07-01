import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/current-user";

export async function GET() {
  try {
    await requireUser();
    const [total, pinned, archived, byScope, byType] = await Promise.all([
      db.memory.count({ where: { archived: false } }),
      db.memory.count({ where: { pinned: true, archived: false } }),
      db.memory.count({ where: { archived: true } }),
      db.memory.groupBy({ by: ["scope"], where: { archived: false }, _count: { id: true } }),
      db.memory.groupBy({ by: ["type"], where: { archived: false }, _count: { id: true } }),
    ]);
    return NextResponse.json({ total, pinned, archived, byScope, byType });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/memories/stats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
