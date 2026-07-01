import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [installed, custom] = await Promise.all([
    db.installedModule.findMany(),
    db.customModule.findMany({ orderBy: { order: "asc" } }),
  ]);
  return NextResponse.json({ installed, custom });
}
