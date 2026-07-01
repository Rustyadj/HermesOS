import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";
  const projectId = searchParams.get("projectId") ?? undefined;

  const notes = await db.obsidianNote.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
          { tags: { has: search } },
        ],
      } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, tags: true, backlinks: true, projectId: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const body = await req.json();
  const note = await db.obsidianNote.create({
    data: {
      title: body.title ?? "Untitled",
      content: body.content ?? "",
      tags: body.tags ?? [],
      backlinks: [],
      projectId: body.projectId ?? null,
    },
  });
  return NextResponse.json(note);
}
