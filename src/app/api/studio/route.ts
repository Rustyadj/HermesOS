import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const projects = await db.obsidianNote.findMany({
    where: { tags: { has: "studio-project" } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, tags: true, updatedAt: true, createdAt: true },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    title: string;
    content: string;
    tags?: string[];
  };
  const project = await db.obsidianNote.create({
    data: {
      title: body.title ?? "Untitled Design",
      content: body.content ?? "",
      tags: ["studio-project", ...(body.tags ?? [])],
      backlinks: [],
    },
  });
  return NextResponse.json(project);
}
