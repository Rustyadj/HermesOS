import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const modules = await db.customModule.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(modules);
}

export async function POST(req: Request) {
  const body = await req.json() as {
    label: string; icon?: string; description?: string;
    contentType?: string; content?: string; order?: number;
  };
  const moduleId = `custom-${body.label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
  const mod = await db.customModule.create({
    data: {
      moduleId,
      label: body.label,
      icon: body.icon ?? "Puzzle",
      description: body.description ?? "",
      contentType: body.contentType ?? "markdown",
      content: body.content ?? `# ${body.label}\n\nCustom module content goes here.`,
      order: body.order ?? 200,
    },
  });
  return NextResponse.json(mod, { status: 201 });
}
