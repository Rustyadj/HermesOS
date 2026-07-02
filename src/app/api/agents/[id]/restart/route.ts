import { NextResponse } from "next/server";
import { ALLOWED_AGENT_IDS, getVpsAgent } from "@/lib/agents/registry";
import { getControlPlaneUser, canRestartAgent, unauthorized, forbidden } from "@/lib/agents/permissions";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await getControlPlaneUser();
  if (!user) return unauthorized();
  if (!canRestartAgent(user.role)) return forbidden("restart agents");

  const { id } = await params;
  if (!ALLOWED_AGENT_IDS.has(id)) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const agent = getVpsAgent(id);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  try {
    await execAsync(`docker restart ${id}`, { timeout: 30000 });
    return NextResponse.json({
      ok: true,
      message: `${agent.name} restarted`,
      agentId: id,
      restartedAt: new Date().toISOString(),
      restartedBy: user.email,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
