import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const project = await db.obsidianNote.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = (await req.json()) as { title?: string; content?: string };
  const project = await db.obsidianNote.update({
    where: { id },
    data: { title: body.title, content: body.content },
  });
  return NextResponse.json(project);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await db.obsidianNote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
