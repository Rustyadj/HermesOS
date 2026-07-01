import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const tasks = await db.task.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const body = await req.json() as {
    title: string; description?: string; status?: string;
    priority?: string; projectId?: string; agentId?: string;
    assignee?: string; dueDate?: string; tags?: string[];
  };
  const task = await db.task.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? "todo",
      priority: body.priority ?? "medium",
      projectId: body.projectId ?? null,
      agentId: body.agentId ?? null,
      assignee: body.assignee ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      tags: body.tags ?? [],
    },
  });
  return NextResponse.json(task, { status: 201 });
}
