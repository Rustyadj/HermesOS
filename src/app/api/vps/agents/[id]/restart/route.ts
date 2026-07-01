import { NextResponse } from "next/server";
import { getVpsAgent } from "@/lib/vps/agentRegistry";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

type Params = { params: Promise<{ id: string }> };

const ALLOWED_IDS = new Set(["hermes-lisa", "hermes-clint", "openclaw"]);

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;

  if (!ALLOWED_IDS.has(id)) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const agent = getVpsAgent(id);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  try {
    await execAsync(`docker restart ${id}`);
    return NextResponse.json({
      ok: true,
      message: `${agent.name} restarted`,
      restartedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
