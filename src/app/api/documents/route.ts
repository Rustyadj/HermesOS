import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;
  const docs = await db.document.findMany({
    where: { ...(projectId ? { projectId } : {}) },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    select: { id: true, title: true, type: true, tags: true, pinned: true, version: true, projectId: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  const body = await req.json() as { title: string; content?: string; type?: string; projectId?: string; tags?: string[] };
  const doc = await db.document.create({
    data: {
      title: body.title,
      content: body.content ?? "",
      type: body.type ?? "markdown",
      projectId: body.projectId ?? null,
      tags: body.tags ?? [],
    },
  });
  return NextResponse.json(doc, { status: 201 });
}
