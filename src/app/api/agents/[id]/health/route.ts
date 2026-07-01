import { NextResponse } from "next/server";

const HERMES_PORTS: Record<string, number> = {
  "hermes-lisa": 4860,
  "hermes-clint": 4861,
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const port = HERMES_PORTS[id];
  if (!port)
    return NextResponse.json({ status: "unknown", message: "No health endpoint" });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`http://127.0.0.1:${port}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return NextResponse.json({
      status: res.ok ? "online" : "degraded",
      port,
      statusCode: res.status,
    });
  } catch {
    return NextResponse.json({ status: "offline", port });
  }
}
