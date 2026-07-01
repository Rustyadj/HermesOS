import { NextResponse } from "next/server";
import { getVpsAgent } from "@/lib/vps/agentRegistry";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

type Params = { params: Promise<{ id: string }> };

const ALLOWED_IDS = new Set(["hermes-lisa", "hermes-clint", "openclaw"]);

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  // Allowlist check — never interpolate arbitrary user input into shell
  if (!ALLOWED_IDS.has(id)) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const agent = getVpsAgent(id);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  try {
    // Map agent id to docker container name (same id by convention)
    const { stdout, stderr } = await execAsync(
      `docker logs --tail 100 ${id} 2>&1`
    );
    const lines = (stdout + stderr)
      .split("\n")
      .filter(Boolean)
      .slice(-100);
    return NextResponse.json({ lines, source: `docker:${id}` });
  } catch (err) {
    return NextResponse.json({
      lines: [`[sentinel] Could not fetch logs: ${(err as Error).message}`],
      source: "error",
    });
  }
}
