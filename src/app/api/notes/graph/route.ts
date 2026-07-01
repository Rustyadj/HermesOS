import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const notes = await db.obsidianNote.findMany({
    select: { id: true, title: true, tags: true, backlinks: true, projectId: true },
  });
  const projects = await db.project.findMany({ select: { id: true, name: true } });

  const nodes = [
    ...notes.map((n) => ({
      id: n.id,
      type: "note",
      data: { label: n.title, tags: n.tags, projectId: n.projectId },
    })),
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      type: "project",
      data: { label: p.name },
    })),
  ];

  const edges: { id: string; source: string; target: string }[] = [];

  // Wiki link edges between notes
  for (const note of notes) {
    for (const backlinkId of note.backlinks) {
      edges.push({ id: `bl-${backlinkId}-${note.id}`, source: backlinkId, target: note.id });
    }
  }

  // Project → note edges
  for (const note of notes) {
    if (note.projectId) {
      edges.push({ id: `pn-${note.id}`, source: `project-${note.projectId}`, target: note.id });
    }
  }

  return NextResponse.json({ nodes, edges });
}
