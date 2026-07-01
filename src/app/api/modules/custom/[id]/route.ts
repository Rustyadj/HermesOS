import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await db.customModule.update({ where: { id }, data: body as any });
  return NextResponse.json(mod);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await db.customModule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
