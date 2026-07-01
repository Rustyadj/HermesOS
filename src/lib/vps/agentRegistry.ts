/**
 * VPS Agent Registry — server-side only.
 * Reads from environment variables. Never imported in client components.
 */

export interface VpsAgent {
  id: string;
  name: string;
  description: string;
  model: string;
  endpoint: string;
  configPath: string;
  legacyPath: string | null;
  dashboardPort: number | null;
  kind: "hermes" | "openclaw" | "custom";
}

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export function getVpsAgents(): VpsAgent[] {
  const agentConfigDir = env("AGENT_CONFIG_DIR", "/opt/sentinel-os/agents");

  return [
    {
      id: "hermes-lisa",
      name: "Hermes Lisa",
      description: "Primary AI assistant — Claude Code OAuth, web terminal",
      model: env("HERMES_LISA_MODEL", "claude-sonnet-4-6"),
      endpoint: env("HERMES_ENDPOINT", "http://127.0.0.1:4860"),
      configPath: `${agentConfigDir}/hermes-lisa/CLAUDE.md`,
      legacyPath: "/legacy/hermes",
      dashboardPort: 4860,
      kind: "hermes",
    },
    {
      id: "hermes-clint",
      name: "Hermes Clint",
      description: "ICF construction estimating specialist",
      model: env("HERMES_CLINT_MODEL", "claude-sonnet-4-6"),
      endpoint: env("HERMES_CLINT_ENDPOINT", "http://127.0.0.1:4861"),
      configPath: `${agentConfigDir}/hermes-clint/CLAUDE.md`,
      legacyPath: null,
      dashboardPort: 4861,
      kind: "hermes",
    },
    {
      id: "openclaw",
      name: "OpenClaw",
      description: "Personal AI assistant — Docker on VPS",
      model: env("OPENCLAW_MODEL", "claude-opus-4-8"),
      endpoint: env("OPENCLAW_ENDPOINT", "http://127.0.0.1:3000"),
      configPath: `${agentConfigDir}/openclaw/config.json`,
      legacyPath: "/legacy/openclaw",
      dashboardPort: null,
      kind: "openclaw",
    },
  ];
}

export function getVpsAgent(id: string): VpsAgent | undefined {
  return getVpsAgents().find((a) => a.id === id);
}
