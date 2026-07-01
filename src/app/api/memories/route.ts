import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/current-user";

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope");
    const type = searchParams.get("type");
    const owner = searchParams.get("owner");
    const pinned = searchParams.get("pinned");
    const archived = searchParams.get("archived") === "true";
    const search = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") ?? "100");

    const memories = await db.memory.findMany({
      where: {
        archived,
        ...(scope ? { scope } : {}),
        ...(type ? { type } : {}),
        ...(owner ? { owner } : {}),
        ...(pinned === "true" ? { pinned: true } : {}),
        ...(search ? {
          OR: [
            { content: { contains: search, mode: "insensitive" } },
            { source: { contains: search, mode: "insensitive" } },
            { tags: { has: search } },
          ],
        } : {}),
      },
      orderBy: [{ pinned: "desc" }, { importanceScore: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true, type: true, scope: true, owner: true, content: true,
        tags: true, confidence: true, importanceScore: true, source: true,
        pinned: true, archived: true, createdAt: true, updatedAt: true,
      },
    });
    return NextResponse.json(memories);
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/memories]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json() as {
      type: string; scope: string; owner: string;
      content: string; tags?: string[];
      confidence?: number; importanceScore?: number; source: string;
    };
    const { type, scope, owner, content, tags = [], confidence = 1.0, importanceScore = 0.5, source } = body;
    if (!type || !scope || !owner || !content || !source) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const memory = await db.memory.create({
      data: { type, scope, owner, content, tags, confidence, importanceScore, source },
      select: {
        id: true, type: true, scope: true, owner: true, content: true,
        tags: true, confidence: true, importanceScore: true, source: true,
        pinned: true, archived: true, createdAt: true, updatedAt: true,
      },
    });
    return NextResponse.json(memory, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/memories]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
