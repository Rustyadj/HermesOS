"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Server, Activity, RefreshCw, RotateCcw, ExternalLink,
  Terminal, FileText, ChevronDown, ChevronRight, Save,
  AlertCircle, CheckCircle2, Clock, Wifi, WifiOff, Loader2,
  Bot, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = "online" | "offline" | "degraded" | "unknown" | "checking";
type AgentKind = "hermes" | "openclaw" | "custom";

interface VpsAgent {
  id: string;
  name: string;
  description: string;
  model: string;
  endpoint: string;
  legacyPath: string | null;
  dashboardPort: number | null;
  kind: AgentKind;
}

interface AgentHealth {
  status: AgentStatus;
  statusCode?: number;
  checkedAt?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KIND_COLORS: Record<AgentKind, string> = {
  hermes:   "text-violet-400",
  openclaw: "text-amber-400",
  custom:   "text-indigo-400",
};

const KIND_BG: Record<AgentKind, string> = {
  hermes:   "bg-violet-500/10 border-violet-500/20",
  openclaw: "bg-amber-500/10 border-amber-500/20",
  custom:   "bg-indigo-500/10 border-indigo-500/20",
};

const STATUS_DOT: Record<AgentStatus, string> = {
  online:   "bg-emerald-400",
  degraded: "bg-yellow-400",
  offline:  "bg-red-400",
  unknown:  "bg-[#3a3f50]",
  checking: "bg-[#3a3f50] animate-pulse",
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  online:   "Online",
  degraded: "Degraded",
  offline:  "Offline",
  unknown:  "Unknown",
  checking: "Checking…",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface LogsPanelProps {
  agentId: string;
}

function LogsPanel({ agentId }: LogsPanelProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vps/agents/${agentId}/logs`);
      const data = await res.json() as { lines: string[]; source: string };
      setLines(data.lines ?? []);
      setSource(data.source ?? "");
    } catch {
      setLines(["[error] Failed to fetch logs"]);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { void fetchLogs(); }, [fetchLogs]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#5a5f6e] font-mono">{source}</span>
        <button
          onClick={() => void fetchLogs()}
          disabled={loading}
          className="flex items-center gap-1 text-[10px] text-[#5a5f6e] hover:text-[#c8cdd8] transition-colors"
        >
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>
      <div className="bg-[#060708] border border-[#1e2130] rounded-lg p-3 h-48 overflow-y-auto font-mono text-[10px] text-[#7a8099] space-y-0.5">
        {loading && lines.length === 0 ? (
          <span className="text-[#3a3f50]">Loading…</span>
        ) : lines.length === 0 ? (
          <span className="text-[#3a3f50]">No log output</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="leading-relaxed break-all">{line}</div>
          ))
        )}
      </div>
    </div>
  );
}

interface ConfigEditorProps {
  agentId: string;
}

function ConfigEditor({ agentId }: ConfigEditorProps) {
  const [content, setContent] = useState("");
  const [filePath, setFilePath] = useState("");
  const [ext, setExt] = useState("");
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/vps/agents/${agentId}/config`);
      const data = await res.json() as { content: string; path: string; ext: string; missing?: boolean; error?: string };
      if (data.error) { setError(data.error); return; }
      setContent(data.content ?? "");
      setFilePath(data.path ?? "");
      setExt(data.ext ?? "");
      setMissing(data.missing ?? false);
    } catch {
      setError("Failed to fetch config");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { void fetchConfig(); }, [fetchConfig]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function saveConfig() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch(`/api/vps/agents/${agentId}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (data.error) { setError(data.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save config");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#5a5f6e] font-mono">
          {filePath || "…"} {ext && <span className="text-[#3a3f50]">{ext}</span>}
          {missing && <span className="text-yellow-500 ml-1">(new file)</span>}
        </span>
        <button
          onClick={() => void saveConfig()}
          disabled={saving || loading}
          className={cn(
            "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors",
            saved
              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
              : "border-[#1e2130] text-[#7a8099] hover:text-[#c8cdd8] hover:border-[#2a2f40]"
          )}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      {error && (
        <p className="text-[10px] text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
      {loading ? (
        <div className="bg-[#060708] border border-[#1e2130] rounded-lg h-48 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-[#3a3f50] animate-spin" />
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          className="w-full bg-[#060708] border border-[#1e2130] rounded-lg p-3 h-48 font-mono text-[10px] text-[#c8cdd8] resize-none outline-none focus:border-indigo-500/40 transition-colors"
          placeholder="Config file content…"
        />
      )}
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

interface AgentCardProps {
  agent: VpsAgent;
}

function AgentCard({ agent }: AgentCardProps) {
  const [health, setHealth] = useState<AgentHealth>({ status: "checking" });
  const [panel, setPanel] = useState<"logs" | "config" | null>(null);
  const [restarting, setRestarting] = useState(false);

  const checkHealth = useCallback(async () => {
    setHealth({ status: "checking" });
    try {
      const res = await fetch(`/api/vps/agents/${agent.id}/health`);
      const data = await res.json() as AgentHealth;
      setHealth(data);
    } catch {
      setHealth({ status: "offline" });
    }
  }, [agent.id]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { void checkHealth(); }, [checkHealth]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function restart() {
    setRestarting(true);
    try {
      await fetch(`/api/vps/agents/${agent.id}/restart`, { method: "POST" });
      setTimeout(() => void checkHealth(), 3000);
    } finally {
      setRestarting(false);
    }
  }

  const statusColor = STATUS_DOT[health.status];
  const isExpanded = panel !== null;

  return (
    <div className={cn(
      "bg-[#0c0e12] border rounded-xl overflow-hidden transition-all",
      isExpanded ? "border-[#2a2f40]" : "border-[#1e2130]"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Avatar */}
        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0", KIND_BG[agent.kind])}>
          {agent.kind === "hermes" ? (
            <Cpu className={cn("w-5 h-5", KIND_COLORS[agent.kind])} />
          ) : agent.kind === "openclaw" ? (
            <Bot className={cn("w-5 h-5", KIND_COLORS[agent.kind])} />
          ) : (
            <Server className={cn("w-5 h-5", KIND_COLORS[agent.kind])} />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#e2e5ed]">{agent.name}</span>
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusColor)} />
            <span className="text-[10px] text-[#5a5f6e]">{STATUS_LABEL[health.status]}</span>
          </div>
          <p className="text-xs text-[#5a5f6e] truncate mt-0.5">{agent.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {agent.legacyPath && (
            <a
              href={agent.legacyPath}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-[#5a5f6e] hover:text-[#c8cdd8] hover:bg-white/5 transition-colors"
              title="Open legacy UI"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => void checkHealth()}
            disabled={health.status === "checking"}
            className="p-1.5 rounded-lg text-[#5a5f6e] hover:text-[#c8cdd8] hover:bg-white/5 transition-colors"
            title="Check health"
          >
            {health.status === "checking" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : health.status === "online" ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
            )}
          </button>
          <button
            onClick={() => void restart()}
            disabled={restarting}
            className="p-1.5 rounded-lg text-[#5a5f6e] hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
            title="Restart container"
          >
            <RotateCcw className={cn("w-3.5 h-3.5", restarting && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 px-4 pb-3 text-[10px] text-[#5a5f6e]">
        <span className="font-mono text-[#3a3f50] truncate max-w-[160px]">{agent.endpoint}</span>
        <span className="ml-auto">{agent.model}</span>
        {health.checkedAt && (
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {new Date(health.checkedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Panel toggle */}
      <div className="flex border-t border-[#1e2130]">
        <button
          onClick={() => setPanel(panel === "logs" ? null : "logs")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium transition-colors",
            panel === "logs" ? "text-indigo-400 bg-indigo-500/5" : "text-[#5a5f6e] hover:text-[#c8cdd8] hover:bg-white/3"
          )}
        >
          <Terminal className="w-3 h-3" />
          Logs
          {panel === "logs" ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <div className="w-px bg-[#1e2130]" />
        <button
          onClick={() => setPanel(panel === "config" ? null : "config")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium transition-colors",
            panel === "config" ? "text-indigo-400 bg-indigo-500/5" : "text-[#5a5f6e] hover:text-[#c8cdd8] hover:bg-white/3"
          )}
        >
          <FileText className="w-3 h-3" />
          Config
          {panel === "config" ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </div>

      {/* Expanded panel */}
      {panel && (
        <div className="p-4 border-t border-[#1e2130] bg-[#080a0d]">
          {panel === "logs" && <LogsPanel agentId={agent.id} />}
          {panel === "config" && <ConfigEditor agentId={agent.id} />}
        </div>
      )}
    </div>
  );
}

// ─── Status Summary Bar ───────────────────────────────────────────────────────

interface SummaryProps {
  agents: VpsAgent[];
}

function StatusSummary({ agents }: SummaryProps) {
  const items = [
    { label: "Total agents", value: agents.length, icon: Server },
    { label: "Hermes containers", value: agents.filter((a) => a.kind === "hermes").length, icon: Cpu },
    { label: "OpenClaw services", value: agents.filter((a) => a.kind === "openclaw").length, icon: Bot },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="bg-[#0c0e12] border border-[#1e2130] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4 text-[#5a5f6e]" />
            <span className="text-[10px] text-[#5a5f6e]">{label}</span>
          </div>
          <span className="text-2xl font-semibold text-[#e2e5ed]">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function VpsPage() {
  const [agents, setAgents] = useState<VpsAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/vps/agents")
      .then((r) => r.json())
      .then((data: VpsAgent[]) => { setAgents(data); setLoading(false); })
      .catch(() => { setError("Failed to load agent registry"); setLoading(false); });
  }, []);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[#e2e5ed]">VPS Control Plane</h1>
            <p className="text-xs text-[#5a5f6e]">Agent registry — health, logs, config</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#3a3f50]">
          <Activity className="w-3 h-3" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-[#5a5f6e]">
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Degraded</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Offline</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#3a3f50]" /> Unknown</span>
        <span className="ml-auto flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-[#3a3f50]" />
          Health checks run on page load
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#3a3f50] animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <StatusSummary agents={agents} />

          <div className="space-y-3">
            <h2 className="text-xs font-medium text-[#7a8099] uppercase tracking-wider">Registered Agents</h2>
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
