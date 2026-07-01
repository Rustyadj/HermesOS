import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/current-user";

export async function GET() {
  try {
    const user = await requireUser();
    const projects = await db.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/projects]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json() as {
      name?: string;
      description?: string;
      status?: string;
      agents?: string[];
      tags?: string[];
    };
    const project = await db.project.create({
      data: {
        name: body.name ?? "New Project",
        description: body.description ?? "",
        status: body.status ?? "active",
        agents: body.agents ?? [],
        tags: body.tags ?? [],
        userId: user.id,
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/projects]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
