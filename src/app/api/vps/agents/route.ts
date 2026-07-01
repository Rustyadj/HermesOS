import { NextResponse } from "next/server";
import { getVpsAgents } from "@/lib/vps/agentRegistry";

export async function GET() {
  const agents = getVpsAgents();
  // Strip configPath from client response — path info is server-only
  return NextResponse.json(
    agents.map(({ configPath: _cp, ...rest }) => rest)
  );
}
