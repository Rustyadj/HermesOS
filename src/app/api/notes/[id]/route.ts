import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function extractWikiLinks(content: string): string[] {
  const matches = content.matchAll(/\[\[([^\]]+)\]\]/g);
  return [...matches].map((m) => m[1].trim());
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await db.obsidianNote.findUnique({ where: { id } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(note);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const note = await db.obsidianNote.update({
    where: { id },
    data: {
      title: body.title,
      content: body.content,
      tags: body.tags ?? [],
      projectId: body.projectId ?? null,
    },
  });

  // Update backlinks: find all notes this note links to, add this note's id to their backlinks
  const linkedTitles = extractWikiLinks(body.content ?? "");
  if (linkedTitles.length > 0) {
    const linkedNotes = await db.obsidianNote.findMany({
      where: { title: { in: linkedTitles } },
      select: { id: true, backlinks: true },
    });
    for (const linked of linkedNotes) {
      if (!linked.backlinks.includes(id)) {
        await db.obsidianNote.update({
          where: { id: linked.id },
          data: { backlinks: [...linked.backlinks, id] },
        });
      }
    }
  }

  return NextResponse.json(note);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Remove this note from other notes' backlinks
  const note = await db.obsidianNote.findUnique({ where: { id }, select: { backlinks: true } });
  if (note) {
    await db.obsidianNote.updateMany({
      where: { backlinks: { has: id } },
      data: { backlinks: { set: [] } },
    });
  }
  await db.obsidianNote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
