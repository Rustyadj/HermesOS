import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  let chart = await db.orgChart.findFirst({ orderBy: { createdAt: "asc" } });
  if (!chart) {
    chart = await db.orgChart.create({
      data: {
        name: "Main",
        nodes: [],
        edges: [],
      },
    });
  }
  return NextResponse.json(chart);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { nodes, edges } = body;

  let chart = await db.orgChart.findFirst({ orderBy: { createdAt: "asc" } });
  if (!chart) {
    chart = await db.orgChart.create({ data: { nodes, edges } });
  } else {
    chart = await db.orgChart.update({
      where: { id: chart.id },
      data: { nodes, edges },
    });
  }
  return NextResponse.json(chart);
}
