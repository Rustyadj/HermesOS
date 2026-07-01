import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ moduleId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { moduleId } = await params;
  const mod = await db.installedModule.findUnique({ where: { moduleId } });
  return NextResponse.json(mod ?? { moduleId, enabled: true });
}

export async function PUT(req: Request, { params }: Params) {
  const { moduleId } = await params;
  const body = await req.json() as { enabled?: boolean; config?: object };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configValue = (body.config ?? {}) as any;
  const mod = await db.installedModule.upsert({
    where: { moduleId },
    create: { moduleId, enabled: body.enabled ?? true, config: configValue },
    update: { enabled: body.enabled, ...(body.config !== undefined && { config: configValue }) },
  });
  return NextResponse.json(mod);
}
