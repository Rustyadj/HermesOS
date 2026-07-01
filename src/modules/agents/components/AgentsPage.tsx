"use client";

import { useState, useEffect } from "react";
import {
  Bot, Plus, Settings2, Zap, Brain, Shield, Globe, Code2,
  MoreHorizontal, Loader2, Check, X, Trash2, RefreshCw,
  ChevronRight, Activity, FileText, History, Wrench,
  CircleDot, Circle, AlertCircle, Save, RotateCcw, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InstructionFile {
  name: string;
  content: string;
  type: "md" | "json" | "yaml" | "txt";
}

interface PromptVersion {
  prompt: string;
  savedAt: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  model: string;
  systemPrompt: string;
  toolPermissions: string[];
  memoryScope: string;
  description: string;
  skills: string[];
  status: string;
  instructionFiles: InstructionFile[];
  promptHistory: PromptVersion[];
  createdAt: string;
  updatedAt: string;
}

const MODELS = [
  "claude-sonnet-4-6",
  "claude-opus-4-8",
  "claude-haiku-4-5-20251001",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "openrouter/anthropic/claude-sonnet-4-6",
];

const ALL_TOOLS = [
  "all", "code_execution", "file_system", "git", "web_search",
  "web_fetch", "document_read", "network_scan", "system_monitor",
  "log_read", "alert_create", "memory_read", "memory_write",
];

const MEMORY_SCOPES = ["session", "project", "workspace", "org", "user", "public"];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  online: { color: "#10b981", label: "Online" },
  busy: { color: "#f59e0b", label: "Busy" },
  idle: { color: "#64748b", label: "Idle" },
  offline: { color: "#ef4444", label: "Offline" },
};

// ─── Agent list item ──────────────────────────────────────────────────────────

function AgentListItem({ agent, selected, onClick }: {
  agent: Agent; selected: boolean; onClick: () => void;
}) {
  const status = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.offline;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors text-left",
        selected ? "bg-indigo-500/15 border border-indigo-500/25" : "hover:bg-white/5 border border-transparent"
      )}
    >
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: agent.color + "22" }}>
          {agent.avatar}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0c0e12]" style={{ backgroundColor: status.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn("text-sm font-medium truncate", selected ? "text-indigo-300" : "text-[#c8cdd8]")}>{agent.name}</div>
        <div className="text-[10px] text-[#5a5f6e] truncate">{agent.role}</div>
      </div>
    </button>
  );
}

// ─── Tab: Profile ─────────────────────────────────────────────────────────────

function ProfileTab({ agent, onSave }: { agent: Agent; onSave: (updates: Partial<Agent>) => Promise<void> }) {
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [avatar, setAvatar] = useState(agent.avatar);
  const [color, setColor] = useState(agent.color);
  const [description, setDescription] = useState(agent.description);
  const [model, setModel] = useState(agent.model);
  const [memoryScope, setMemoryScope] = useState(agent.memoryScope);
  const [status, setStatus] = useState(agent.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await onSave({ name, role, avatar, color, description, model, memoryScope, status });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-5 space-y-4 max-w-xl">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#7a8099] font-medium mb-1.5">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#f5f6f9] border border-[#e0e3ea] rounded-lg px-3 py-2 text-sm text-[#1a1d26] outline-none focus:border-indigo-400 transition-colors" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#7a8099] font-medium mb-1.5">Role</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-[#f5f6f9] border border-[#e0e3ea] rounded-lg px-3 py-2 text-sm text-[#1a1d26] outline-none focus:border-indigo-400 transition-colors" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#7a8099] font-medium mb-1.5">Avatar</label>
          <input value={avatar} onChange={(e) => setAvatar(e.target.value)} className="w-full bg-[#f5f6f9] border border-[#e0e3ea] rounded-lg px-3 py-2 text-sm text-[#1a1d26] outline-none focus:border-indigo-400 transition-colors" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#7a8099] font-medium mb-1.5">Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 rounded-lg border border-[#e0e3ea] cursor-pointer bg-transparent" />
            <input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 bg-[#f5f6f9] border border-[#e0e3ea] rounded-lg px-3 py-2 text-sm text-[#1a1d26] outline-none focus:border-indigo-400 transition-colors" />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-[#7a8099] font-medium mb-1.5">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full bg-[#f5f6f9] border border-[#e0e3ea] rounded-lg px-3 py-2 text-sm text-[#1a1d26] outline-none focus:border-indigo-400 transition-colors resize-none" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#7a8099] font-medium mb-1.5">Model</label>
          <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-[#f5f6f9] border border-[#e0e3ea] rounded-lg px-3 py-2 text-xs text-[#1a1d26] outline-none focus:border-indigo-400 transition-colors">
            {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#7a8099] font-medium mb-1.5">Memory</label>
          <select value={memoryScope} onChange={(e) => setMemoryScope(e.target.value)} className="w-full bg-[#f5f6f9] border border-[#e0e3ea] rounded-lg px-3 py-2 text-xs text-[#1a1d26] outline-none focus:border-indigo-400 transition-colors">
            {MEMORY_SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[#7a8099] font-medium mb-1.5">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-[#f5f6f9] border border-[#e0e3ea] rounded-lg px-3 py-2 text-xs text-[#1a1d26] outline-none focus:border-indigo-400 transition-colors">
            {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <button onClick={save} disabled={saving} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors", saved ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/25" : "bg-indigo-600 hover:bg-indigo-700 text-white")}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving…" : saved ? "Saved" : "Save Profile"}
      </button>
    </div>
  );
}

// ─── Tab: System Prompt ───────────────────────────────────────────────────────

function PromptTab({ agent, onSave }: { agent: Agent; onSave: (updates: Partial<Agent>) => Promise<void> }) {
  const [prompt, setPrompt] = useState(agent.systemPrompt ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const wordCount = prompt.split(/\s+/).filter(Boolean).length;

  async function save() {
    setSaving(true);
    await onSave({ systemPrompt: prompt });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function restoreVersion(v: PromptVersion) {
    setPrompt(v.prompt);
    setShowHistory(false);
  }

  return (
    <div className="p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="text-sm font-semibold text-[#1a1d26]">System Prompt</div>
          <div className="text-[10px] text-[#aab0c0]">{wordCount} words · {prompt.length} chars</div>
        </div>
        <div className="flex items-center gap-2">
          {agent.promptHistory?.length > 0 && (
            <button onClick={() => setShowHistory(!showHistory)} className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors", showHistory ? "bg-indigo-500/15 text-indigo-600 border-indigo-500/25" : "text-[#7a8099] border-[#e0e3ea] hover:bg-[#f5f6f9]")}>
              <History className="w-3.5 h-3.5" />
              History ({agent.promptHistory.length})
            </button>
          )}
          <button onClick={save} disabled={saving} className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors", saved ? "bg-emerald-500/15 text-emerald-600" : "bg-indigo-600 hover:bg-indigo-700 text-white")}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 overflow-y-auto space-y-2">
          {agent.promptHistory.map((v, i) => (
            <div key={i} className="bg-[#f5f6f9] border border-[#e0e3ea] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#7a8099]">{formatDistanceToNow(new Date(v.savedAt), { addSuffix: true })}</span>
                <button onClick={() => restoreVersion(v)} className="flex items-center gap-1 text-[10px] text-indigo-600 hover:underline">
                  <RotateCcw className="w-3 h-3" /> Restore
                </button>
              </div>
              <div className="text-xs text-[#1a1d26] line-clamp-4 font-mono leading-relaxed">{v.prompt}</div>
            </div>
          ))}
        </div>
      ) : (
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 min-h-[300px] bg-[#f5f6f9] border border-[#e0e3ea] rounded-xl p-4 text-sm text-[#1a1d26] font-mono leading-relaxed outline-none focus:border-indigo-400 resize-none transition-colors"
          placeholder="Enter the system prompt for this agent…"
          spellCheck={false}
        />
      )}
    </div>
  );
}

// ─── Tab: Tools ───────────────────────────────────────────────────────────────

function ToolsTab({ agent, onSave }: { agent: Agent; onSave: (updates: Partial<Agent>) => Promise<void> }) {
  const [tools, setTools] = useState<string[]>(agent.toolPermissions);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(tool: string) {
    if (tool === "all") {
      setTools(tools.includes("all") ? [] : ["all"]);
      return;
    }
    const withoutAll = tools.filter((t) => t !== "all");
    setTools(withoutAll.includes(tool) ? withoutAll.filter((t) => t !== tool) : [...withoutAll, tool]);
  }

  async function save() {
    setSaving(true);
    await onSave({ toolPermissions: tools });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-5 space-y-4">
      <div>
        <div className="text-sm font-semibold text-[#1a1d26] mb-1">Tool Permissions</div>
        <div className="text-xs text-[#7a8099] mb-4">Grant this agent permission to use specific tools. &quot;all&quot; grants unrestricted access.</div>
        <div className="grid grid-cols-2 gap-2">
          {ALL_TOOLS.map((tool) => {
            const active = tools.includes(tool) || tools.includes("all");
            return (
              <button
                key={tool}
                onClick={() => toggle(tool)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors text-left",
                  active ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-700" : "bg-[#f5f6f9] border-[#e0e3ea] text-[#7a8099] hover:border-[#c8cdd8]"
                )}
              >
                <div className={cn("w-4 h-4 rounded flex items-center justify-center border shrink-0", active ? "bg-indigo-600 border-indigo-600" : "border-[#c8cdd8]")}>
                  {active && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="font-mono text-xs">{tool}</span>
              </button>
            );
          })}
        </div>
      </div>
      <button onClick={save} disabled={saving} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors", saved ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/25" : "bg-indigo-600 hover:bg-indigo-700 text-white")}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving…" : saved ? "Saved" : "Save Permissions"}
      </button>
    </div>
  );
}

// ─── Tab: Files ───────────────────────────────────────────────────────────────

function FilesTab({ agent, onSave }: { agent: Agent; onSave: (updates: Partial<Agent>) => Promise<void> }) {
  const [files, setFiles] = useState<InstructionFile[]>(agent.instructionFiles ?? []);
  const [activeFile, setActiveFile] = useState<number | null>(files.length > 0 ? 0 : null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function addFile() {
    const newFile: InstructionFile = { name: "instructions.md", content: "# Agent Instructions\n\n", type: "md" };
    const next = [...files, newFile];
    setFiles(next);
    setActiveFile(next.length - 1);
  }

  function updateFile(i: number, updates: Partial<InstructionFile>) {
    setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, ...updates } : f));
  }

  function removeFile(i: number) {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    setActiveFile(next.length > 0 ? 0 : null);
  }

  async function save() {
    setSaving(true);
    await onSave({ instructionFiles: files as unknown as InstructionFile[] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const af = activeFile != null ? files[activeFile] : null;

  return (
    <div className="p-5 flex gap-3 h-full overflow-hidden">
      {/* File list */}
      <div className="w-44 flex flex-col gap-1 shrink-0">
        <div className="text-[9px] uppercase tracking-widest text-[#7a8099] font-medium mb-1">Instruction Files</div>
        {files.map((f, i) => (
          <div key={i} className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors", activeFile === i ? "bg-indigo-500/15 text-indigo-700" : "text-[#7a8099] hover:bg-[#f0f2f7]")} onClick={() => setActiveFile(i)}>
            <FileText className="w-3 h-3 shrink-0" />
            <span className="text-xs truncate flex-1">{f.name}</span>
            <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button onClick={addFile} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-[#aab0c0] hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors mt-1">
          <Plus className="w-3 h-3" /> New file
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col gap-2 min-w-0 overflow-hidden">
        {af ? (
          <>
            <div className="flex items-center gap-2 shrink-0">
              <input
                value={af.name}
                onChange={(e) => updateFile(activeFile!, { name: e.target.value })}
                className="flex-1 bg-[#f5f6f9] border border-[#e0e3ea] rounded-lg px-2.5 py-1.5 text-xs text-[#1a1d26] outline-none focus:border-indigo-400 font-mono"
              />
              <select value={af.type} onChange={(e) => updateFile(activeFile!, { type: e.target.value as InstructionFile["type"] })} className="bg-[#f5f6f9] border border-[#e0e3ea] rounded-lg px-2 py-1.5 text-xs text-[#1a1d26] outline-none">
                {["md", "json", "yaml", "txt"].map((t) => <option key={t} value={t}>.{t}</option>)}
              </select>
              <button onClick={save} disabled={saving} className={cn("flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors", saved ? "bg-emerald-500/15 text-emerald-600" : "bg-indigo-600 text-white hover:bg-indigo-700")}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                {saved ? "Saved" : "Save"}
              </button>
            </div>
            <textarea
              value={af.content}
              onChange={(e) => updateFile(activeFile!, { content: e.target.value })}
              className="flex-1 bg-[#f5f6f9] border border-[#e0e3ea] rounded-xl p-3 text-xs text-[#1a1d26] font-mono leading-relaxed outline-none focus:border-indigo-400 resize-none transition-colors"
              spellCheck={false}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <FileText className="w-10 h-10 text-[#c8cdd8] mx-auto mb-2" />
              <div className="text-sm text-[#7a8099]">No instruction files</div>
              <button onClick={addFile} className="mt-2 text-xs text-indigo-600 hover:underline">Add one</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Health ──────────────────────────────────────────────────────────────

function HealthTab({ agent, onStatusChange }: { agent: Agent; onStatusChange: (status: string) => void }) {
  const [health, setHealth] = useState<{ status: string; port?: number; statusCode?: number; message?: string } | null>(null);
  const [checking, setChecking] = useState(false);

  async function checkHealth() {
    setChecking(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/health`);
      const data = await res.json() as { status: string; port?: number; statusCode?: number; message?: string };
      setHealth(data);
      if (data.status === "online" || data.status === "offline") {
        onStatusChange(data.status);
      }
    } catch {
      setHealth({ status: "offline" });
    } finally {
      setChecking(false);
    }
  }

  const status = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.offline;

  return (
    <div className="p-5 space-y-4">
      {/* Current status */}
      <div className="bg-[#f5f6f9] border border-[#e0e3ea] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: agent.color + "22" }}>{agent.avatar}</div>
            <div>
              <div className="text-sm font-semibold text-[#1a1d26]">{agent.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: status.color }} />
                <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
              </div>
            </div>
          </div>
          <button onClick={checkHealth} disabled={checking} className="flex items-center gap-1.5 text-xs text-[#7a8099] hover:text-[#1a1d26] bg-white border border-[#e0e3ea] px-3 py-2 rounded-lg transition-colors">
            {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Ping
          </button>
        </div>
      </div>

      {/* Health result */}
      {health && (
        <div className={cn("rounded-xl p-4 border", health.status === "online" ? "bg-emerald-500/10 border-emerald-500/20" : health.status === "unknown" ? "bg-[#f5f6f9] border-[#e0e3ea]" : "bg-red-500/10 border-red-500/20")}>
          <div className="flex items-center gap-2 mb-2">
            {health.status === "online" ? <Check className="w-4 h-4 text-emerald-600" /> : health.status === "unknown" ? <AlertCircle className="w-4 h-4 text-[#7a8099]" /> : <X className="w-4 h-4 text-red-500" />}
            <span className={cn("text-sm font-medium", health.status === "online" ? "text-emerald-700" : health.status === "unknown" ? "text-[#7a8099]" : "text-red-600")}>
              {health.status === "online" ? "Agent is reachable" : health.status === "unknown" ? "No health endpoint configured" : "Agent unreachable"}
            </span>
          </div>
          {health.port && <div className="text-[10px] text-[#7a8099]">Port: {health.port} · HTTP {health.statusCode}</div>}
          {health.message && <div className="text-[10px] text-[#7a8099]">{health.message}</div>}
        </div>
      )}

      {/* Model info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#f5f6f9] border border-[#e0e3ea] rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-[#aab0c0] font-medium mb-1">Model</div>
          <div className="text-xs font-mono text-[#1a1d26]">{agent.model}</div>
        </div>
        <div className="bg-[#f5f6f9] border border-[#e0e3ea] rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-[#aab0c0] font-medium mb-1">Memory Scope</div>
          <div className="text-xs font-mono text-[#1a1d26]">{agent.memoryScope}</div>
        </div>
        <div className="bg-[#f5f6f9] border border-[#e0e3ea] rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-[#aab0c0] font-medium mb-1">Tools</div>
          <div className="text-xs text-[#1a1d26]">{agent.toolPermissions.length} permissions</div>
        </div>
        <div className="bg-[#f5f6f9] border border-[#e0e3ea] rounded-xl p-3">
          <div className="text-[9px] uppercase tracking-widest text-[#aab0c0] font-medium mb-1">Instruction Files</div>
          <div className="text-xs text-[#1a1d26]">{agent.instructionFiles?.length ?? 0} files</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main AgentsPage ──────────────────────────────────────────────────────────

const TABS = [
  { id: "profile", label: "Profile", icon: Bot },
  { id: "prompt", label: "System Prompt", icon: FileText },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "files", label: "Files", icon: FileText },
  { id: "health", label: "Health", icon: Activity },
] as const;

type TabId = typeof TABS[number]["id"];

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const selectedAgent = agents.find((a) => a.id === selectedId) ?? null;
  const online = agents.filter((a) => a.status === "online").length;

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        setAgents(data as Agent[]);
        if ((data as Agent[]).length > 0) setSelectedId((data as Agent[])[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function createAgent() {
    setCreating(true);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Agent", role: "Assistant", avatar: "🤖", color: "#6366f1", model: "claude-sonnet-4-6" }),
    });
    const agent = await res.json() as Agent;
    setAgents((prev) => [...prev, agent]);
    setSelectedId(agent.id);
    setActiveTab("profile");
    setCreating(false);
  }

  async function saveAgent(id: string, updates: Partial<Agent>) {
    const res = await fetch(`/api/agents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const updated = await res.json() as Agent;
    setAgents((prev) => prev.map((a) => a.id === id ? updated : a));
  }

  async function deleteAgent(id: string) {
    await fetch(`/api/agents/${id}`, { method: "DELETE" });
    const remaining = agents.filter((a) => a.id !== id);
    setAgents(remaining);
    setSelectedId(remaining[0]?.id ?? null);
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: agent list */}
      <div className="w-56 flex flex-col h-full bg-[--sidebar] border-r border-[#181b22] overflow-hidden shrink-0">
        <div className="flex items-center justify-between px-3 py-3 border-b border-[#181b22]">
          <div>
            <div className="text-xs font-semibold text-[#c8cdd8]">Agents</div>
            <div className="text-[9px] text-[#3a3f50]">{agents.length} registered · {online} online</div>
          </div>
          <button onClick={createAgent} disabled={creating} className="w-7 h-7 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 flex items-center justify-center text-indigo-400 transition-colors">
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-[#3a3f50] animate-spin" /></div>
          ) : agents.map((agent) => (
            <AgentListItem key={agent.id} agent={agent} selected={selectedId === agent.id} onClick={() => setSelectedId(agent.id)} />
          ))}
        </div>
      </div>

      {/* Right: editor */}
      {selectedAgent ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#e0e3ea] bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: selectedAgent.color + "22" }}>{selectedAgent.avatar}</div>
              <div>
                <div className="text-sm font-semibold text-[#1a1d26]">{selectedAgent.name}</div>
                <div className="text-xs text-[#7a8099]">{selectedAgent.role} · {selectedAgent.model}</div>
              </div>
            </div>
            <button onClick={() => deleteAgent(selectedAgent.id)} className="p-2 rounded-lg text-[#aab0c0] hover:text-red-500 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-[#e0e3ea] bg-white shrink-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeTab === id ? "bg-indigo-500/15 text-indigo-700" : "text-[#7a8099] hover:bg-[#f5f6f9] hover:text-[#1a1d26]"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "profile" && <ProfileTab key={selectedAgent.id + "p"} agent={selectedAgent} onSave={(u) => saveAgent(selectedAgent.id, u)} />}
            {activeTab === "prompt" && <PromptTab key={selectedAgent.id + "sp"} agent={selectedAgent} onSave={(u) => saveAgent(selectedAgent.id, u)} />}
            {activeTab === "tools" && <ToolsTab key={selectedAgent.id + "t"} agent={selectedAgent} onSave={(u) => saveAgent(selectedAgent.id, u)} />}
            {activeTab === "files" && <FilesTab key={selectedAgent.id + "f"} agent={selectedAgent} onSave={(u) => saveAgent(selectedAgent.id, u)} />}
            {activeTab === "health" && <HealthTab key={selectedAgent.id + "h"} agent={selectedAgent} onStatusChange={(status) => saveAgent(selectedAgent.id, { status })} />}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Bot className="w-12 h-12 text-[#c8cdd8] mx-auto mb-3" />
            <div className="text-sm font-semibold text-[#1a1d26] mb-1">No agent selected</div>
            <button onClick={createAgent} className="text-xs text-indigo-600 hover:underline">Create one</button>
          </div>
        </div>
      )}
    </div>
  );
}
