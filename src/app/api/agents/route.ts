import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AGENT_TEMPLATES } from "@/lib/constants";

async function seedIfEmpty() {
  const count = await db.agent.count();
  if (count === 0) {
    await db.agent.createMany({
      data: AGENT_TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        avatar: t.avatar,
        color: t.color,
        model: t.model,
        systemPrompt: t.systemPrompt ?? "",
        toolPermissions: t.toolPermissions ?? [],
        memoryScope: t.memoryScope ?? "session",
        description: t.description ?? "",
        skills: t.skills ?? [],
        status: "online",
      })),
      skipDuplicates: true,
    });
  }
}

export async function GET() {
  await seedIfEmpty();
  const agents = await db.agent.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(agents);
}

export async function POST(req: Request) {
  const body = await req.json() as {
    name: string; role: string; avatar: string; color: string;
    model: string; systemPrompt?: string; toolPermissions?: string[];
    memoryScope?: string; description?: string; skills?: string[];
  };
  const agent = await db.agent.create({
    data: {
      name: body.name,
      role: body.role,
      avatar: body.avatar ?? "🤖",
      color: body.color ?? "#6366f1",
      model: body.model ?? "claude-sonnet-4-6",
      systemPrompt: body.systemPrompt ?? "",
      toolPermissions: body.toolPermissions ?? [],
      memoryScope: body.memoryScope ?? "session",
      description: body.description ?? "",
      skills: body.skills ?? [],
    },
  });
  return NextResponse.json(agent, { status: 201 });
}
