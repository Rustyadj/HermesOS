import { NextResponse } from "next/server";
import { getVpsAgent } from "@/lib/vps/agentRegistry";
import { readFile, writeFile } from "fs/promises";
import path from "path";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_IDS = new Set(["hermes-lisa", "hermes-clint", "openclaw"]);
const ALLOWED_EXTENSIONS = new Set([".md", ".json", ".yaml", ".yml", ".txt"]);

function safeConfigPath(configPath: string): boolean {
  const agentConfigDir = process.env.AGENT_CONFIG_DIR ?? "/opt/sentinel-os/agents";
  const resolved = path.resolve(configPath);
  return resolved.startsWith(path.resolve(agentConfigDir));
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  if (!ALLOWED_IDS.has(id)) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const agent = getVpsAgent(id);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const ext = path.extname(agent.configPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Config file type not allowed" }, { status: 403 });
  }

  if (!safeConfigPath(agent.configPath)) {
    return NextResponse.json({ error: "Config path outside allowed directory" }, { status: 403 });
  }

  try {
    const content = await readFile(agent.configPath, "utf-8");
    return NextResponse.json({ content, path: path.basename(agent.configPath), ext });
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      return NextResponse.json({ content: "", path: path.basename(agent.configPath), ext, missing: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;

  if (!ALLOWED_IDS.has(id)) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const agent = getVpsAgent(id);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const ext = path.extname(agent.configPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Config file type not allowed" }, { status: 403 });
  }

  if (!safeConfigPath(agent.configPath)) {
    return NextResponse.json({ error: "Config path outside allowed directory" }, { status: 403 });
  }

  const { content } = await req.json() as { content: string };
  if (typeof content !== "string") {
    return NextResponse.json({ error: "content must be a string" }, { status: 400 });
  }

  try {
    await writeFile(agent.configPath, content, "utf-8");
    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
