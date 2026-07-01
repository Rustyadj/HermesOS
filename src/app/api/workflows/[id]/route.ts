import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workflow = await db.workflow.findUnique({ where: { id } });
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(workflow);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const workflow = await db.workflow.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      nodes: body.nodes,
      edges: body.edges,
      status: body.status,
    },
  });
  return NextResponse.json(workflow);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.workflow.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
