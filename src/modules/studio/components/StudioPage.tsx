"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Layers,
  Plus,
  Loader2,
  Send,
  Monitor,
  Tablet,
  Smartphone,
  Terminal,
  GitBranch,
  FileCode,
  Database,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  File,
  Boxes,
  Image,
  Play,
  RotateCcw,
  Maximize2,
  SplitSquareVertical,
  Cpu,
  AlertCircle,
  Package,
  Workflow,
  Globe,
  Server,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyStore } from "@/store/useKeyStore";

// ─── Types ──────────────────────────────────────────────────────────────────

type PreviewDevice = "desktop" | "tablet" | "mobile";
type BottomTab = "terminal" | "logs" | "git" | "preview";
type LeftTab = "files" | "components" | "assets" | "database" | "chats";

interface BuildMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  expanded?: boolean;
}

// ─── Build capabilities that AI Studio can create ────────────────────────────

const BUILD_TARGETS = [
  { icon: Globe, label: "Website", description: "Marketing sites, landing pages, docs" },
  { icon: Monitor, label: "Web App", description: "Full-stack Next.js applications" },
  { icon: Smartphone, label: "Mobile App", description: "React Native / Expo" },
  { icon: Package, label: "Sentinel Module", description: "Custom OS module / plugin" },
  { icon: Cpu, label: "Agent", description: "AI agent with tools and memory" },
  { icon: Workflow, label: "Workflow", description: "Automated task sequences" },
  { icon: Server, label: "API", description: "REST or GraphQL endpoints" },
  { icon: Database, label: "Database", description: "Schema, migrations, seed data" },
  { icon: BarChart2, label: "Dashboard", description: "Analytics and reporting views" },
];

const QUICK_COMMANDS = [
  "Create a CRM dashboard with pipeline view",
  "Add Stripe billing to this project",
  "Build a Sentinel module for inventory tracking",
  "Create an AI agent with web search tools",
  "Generate a REST API for the user schema",
  "Convert this to a mobile-first layout",
  "Deploy to Vercel with env configuration",
  "Create a Postgres schema for multi-tenant SaaS",
];

// ─── Mock file tree ──────────────────────────────────────────────────────────

const MOCK_FILES: FileNode[] = [
  {
    name: "src", type: "folder", expanded: true,
    children: [
      { name: "app", type: "folder", expanded: true, children: [
        { name: "page.tsx", type: "file" },
        { name: "layout.tsx", type: "file" },
        { name: "globals.css", type: "file" },
      ]},
      { name: "components", type: "folder", children: [
        { name: "Header.tsx", type: "file" },
        { name: "Dashboard.tsx", type: "file" },
      ]},
      { name: "lib", type: "folder", children: [
        { name: "db.ts", type: "file" },
        { name: "utils.ts", type: "file" },
      ]},
    ],
  },
  { name: "prisma", type: "folder", children: [
    { name: "schema.prisma", type: "file" },
  ]},
  { name: "package.json", type: "file" },
  { name: "next.config.ts", type: "file" },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function FileTree({ nodes, depth = 0 }: { nodes: FileNode[]; depth?: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(nodes.filter(n => n.expanded).map(n => n.name))
  );

  return (
    <div>
      {nodes.map((node) => (
        <div key={node.name}>
          <button
            onClick={() => {
              if (node.type === "folder") {
                setExpanded(prev => {
                  const next = new Set(prev);
                  if (next.has(node.name)) { next.delete(node.name); } else { next.add(node.name); }
                  return next;
                });
              }
            }}
            className="flex items-center gap-1.5 w-full px-1 py-0.5 rounded hover:bg-white/5 text-left group"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {node.type === "folder" ? (
              <>
                {expanded.has(node.name)
                  ? <ChevronDown className="w-3 h-3 text-[#5a5f6e] shrink-0" />
                  : <ChevronRight className="w-3 h-3 text-[#5a5f6e] shrink-0" />}
                {expanded.has(node.name)
                  ? <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  : <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </>
            ) : (
              <>
                <span className="w-3 h-3 shrink-0" />
                <File className="w-3.5 h-3.5 text-[#5a5f6e] shrink-0" />
              </>
            )}
            <span className="text-xs text-[#7a8099] group-hover:text-[#c8cdd8] truncate">
              {node.name}
            </span>
          </button>
          {node.type === "folder" && expanded.has(node.name) && node.children && (
            <FileTree nodes={node.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

function TerminalPanel() {
  const lines = [
    { type: "info", text: "▶ next dev" },
    { type: "success", text: "✓ Ready in 1.2s" },
    { type: "info", text: "○ Compiling /dashboard ..." },
    { type: "success", text: "✓ Compiled /dashboard in 847ms" },
    { type: "muted", text: "GET /api/health 200 in 12ms" },
    { type: "muted", text: "GET /dashboard 200 in 234ms" },
  ];
  return (
    <div className="p-3 font-mono text-xs space-y-0.5 overflow-auto h-full">
      {lines.map((line, i) => (
        <div key={i} className={cn(
          line.type === "success" && "text-emerald-400",
          line.type === "info" && "text-indigo-400",
          line.type === "muted" && "text-[#5a5f6e]",
        )}>
          {line.text}
        </div>
      ))}
      <div className="flex items-center gap-1 text-[#3a3f50]">
        <span>$</span>
        <span className="animate-pulse">▋</span>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function StudioPage() {
  const { anthropicKey } = useKeyStore();
  const [leftTab, setLeftTab] = useState<LeftTab>("files");
  const [bottomTab, setBottomTab] = useState<BottomTab>("terminal");
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [showPreview, setShowPreview] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);
  const [messages, setMessages] = useState<BuildMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [_activeFile, _setActiveFile] = useState("app/page.tsx");
  const [showLanding, setShowLanding] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setShowLanding(false);
    const userMsg: BuildMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    if (!anthropicKey) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "**API key required.** Go to Settings → API Keys and add your Anthropic key to start building.",
        createdAt: new Date(),
      }]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-anthropic-key": anthropicKey,
        },
        body: JSON.stringify({
          agentId: "claude-code",
          messages: [
            ...messages.map(m => ({ role: m.role === "user" ? "user" : "assistant" as const, content: m.content })),
            { role: "user" as const, content: text.trim() },
          ],
        }),
      });

      const assistantMsg: BuildMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]" || !raw) continue;
          try {
            const parsed = JSON.parse(raw) as { type: string; text?: string };
            if (parsed.type === "text" && parsed.text) {
              setMessages(prev => prev.map(m =>
                m.id === assistantMsg.id
                  ? { ...m, content: m.content + parsed.text }
                  : m
              ));
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Build request failed. Check your API key in Settings.",
        createdAt: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [anthropicKey, loading, messages]);

  const deviceWidths: Record<PreviewDevice, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "390px",
  };

  const LEFT_TABS: { id: LeftTab; icon: typeof Layers; label: string }[] = [
    { id: "files", icon: FileCode, label: "Files" },
    { id: "components", icon: Boxes, label: "Components" },
    { id: "assets", icon: Image, label: "Assets" },
    { id: "database", icon: Database, label: "Database" },
    { id: "chats", icon: MessageSquare, label: "AI Chats" },
  ];

  const BOTTOM_TABS: { id: BottomTab; icon: typeof Terminal; label: string }[] = [
    { id: "terminal", icon: Terminal, label: "Terminal" },
    { id: "logs", icon: AlertCircle, label: "Logs" },
    { id: "git", icon: GitBranch, label: "Git" },
    { id: "preview", icon: Globe, label: "Preview Server" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#080a0d] text-[#c8cdd8]">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 h-11 px-3 border-b border-[#181b22] shrink-0">
        <div className="flex items-center gap-1.5 mr-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-[#e2e5ed]">AI Studio</span>
          <span className="text-[10px] text-[#3a3f50] ml-1 bg-[#1a1d26] border border-[#1e2130] px-1.5 py-0.5 rounded">
            Build Engine
          </span>
        </div>

        {/* Project breadcrumb */}
        <span className="text-[#3a3f50] text-xs">No project open</span>
        <button className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors ml-1">
          <Plus className="w-3 h-3" /> Open project
        </button>

        <div className="flex-1" />

        {/* Device toggle */}
        <div className="flex items-center gap-0.5 bg-[#0f1117] border border-[#1e2130] rounded-lg p-0.5">
          {([
            { id: "desktop", Icon: Monitor },
            { id: "tablet", Icon: Tablet },
            { id: "mobile", Icon: Smartphone },
          ] as { id: PreviewDevice; Icon: typeof Monitor }[]).map(({ id, Icon }) => (
            <button
              key={id}
              onClick={() => setDevice(id)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                device === id ? "bg-[#1a1d26] text-[#c8cdd8]" : "text-[#3a3f50] hover:text-[#7a8099]"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowPreview(p => !p)}
          className="text-xs text-[#5a5f6e] hover:text-[#c8cdd8] transition-colors flex items-center gap-1"
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
          {showPreview ? "Hide" : "Preview"}
        </button>

        <button className="flex items-center gap-1.5 h-7 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">
          <Play className="w-3 h-3" /> Run
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left panel ── */}
        <div className="flex border-r border-[#181b22] shrink-0">
          {/* Icon rail */}
          <div className="flex flex-col w-10 border-r border-[#181b22] py-2 gap-1 items-center">
            {LEFT_TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setLeftTab(id)}
                title={label}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  leftTab === id ? "bg-indigo-500/15 text-indigo-400" : "text-[#3a3f50] hover:text-[#7a8099] hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="w-52 overflow-y-auto">
            {leftTab === "files" && (
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#3a3f50] font-medium">Explorer</span>
                  <button className="text-[#3a3f50] hover:text-[#7a8099]">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <FileTree nodes={MOCK_FILES} />
              </div>
            )}

            {leftTab === "components" && (
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#3a3f50] font-medium">Components</span>
                </div>
                {["Button", "Card", "Modal", "Table", "Form", "Chart", "Badge", "Avatar"].map(c => (
                  <button key={c} className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-white/5 text-left">
                    <Boxes className="w-3 h-3 text-[#5a5f6e] shrink-0" />
                    <span className="text-xs text-[#7a8099] hover:text-[#c8cdd8]">{c}</span>
                  </button>
                ))}
              </div>
            )}

            {leftTab === "assets" && (
              <div className="p-2">
                <div className="px-2 py-1 mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#3a3f50] font-medium">Assets</span>
                </div>
                <div className="border-2 border-dashed border-[#1e2130] rounded-lg p-4 text-center">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image className="w-6 h-6 mx-auto text-[#3a3f50] mb-1" />
                  <p className="text-[10px] text-[#3a3f50]">Drop files here</p>
                </div>
              </div>
            )}

            {leftTab === "database" && (
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#3a3f50] font-medium">Schema</span>
                </div>
                {["User", "Project", "Agent", "Memory", "Task", "Document"].map(t => (
                  <button key={t} className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-white/5 text-left">
                    <Database className="w-3 h-3 text-[#5a5f6e] shrink-0" />
                    <span className="text-xs text-[#7a8099]">{t}</span>
                  </button>
                ))}
              </div>
            )}

            {leftTab === "chats" && (
              <div className="p-2 space-y-1">
                <div className="px-2 py-1 mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-[#3a3f50] font-medium">Build History</span>
                </div>
                {messages.length === 0 ? (
                  <p className="text-[10px] text-[#3a3f50] px-2">No sessions yet</p>
                ) : (
                  <div className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-[10px] text-indigo-400">Active session</p>
                    <p className="text-[10px] text-[#5a5f6e] truncate">{messages[0]?.content.slice(0, 40)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Center: preview ── */}
        {showPreview && (
          <div className="flex-1 flex flex-col min-w-0 border-r border-[#181b22]">
            {/* Preview toolbar */}
            <div className="flex items-center gap-2 h-9 px-3 border-b border-[#181b22] shrink-0 bg-[#0c0e12]">
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28ca41]" />
              </div>
              <div className="flex-1 bg-[#080a0d] border border-[#1e2130] rounded-md px-2 py-0.5 text-[10px] text-[#3a3f50] text-center">
                localhost:3000
              </div>
              <button className="text-[#3a3f50] hover:text-[#7a8099]">
                <RotateCcw className="w-3 h-3" />
              </button>
              <button className="text-[#3a3f50] hover:text-[#7a8099]">
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>

            {/* Preview frame */}
            <div className="flex-1 overflow-auto bg-[#151820] flex items-start justify-center p-4">
              <div
                className="bg-white h-full rounded-lg shadow-2xl overflow-hidden transition-all duration-300 border border-[#1e2130]"
                style={{ width: deviceWidths[device], maxWidth: "100%", minHeight: "400px" }}
              >
                {showLanding ? (
                  <div className="h-full flex flex-col items-center justify-center bg-[#f8f9fb] text-gray-400 p-8 text-center">
                    <Sparkles className="w-10 h-10 mb-3 text-indigo-400" />
                    <p className="text-sm font-medium text-gray-600">No project loaded</p>
                    <p className="text-xs mt-1">Use the Build with AI panel to create something</p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-[#f8f9fb] text-gray-400">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-indigo-400" />
                      <p className="text-xs">Building…</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom tabs */}
            {bottomOpen && (
              <div className="h-40 border-t border-[#181b22] flex flex-col shrink-0">
                <div className="flex items-center border-b border-[#181b22] px-2 gap-1 shrink-0">
                  {BOTTOM_TABS.map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setBottomTab(id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wide border-b-2 transition-colors",
                        bottomTab === id
                          ? "border-indigo-500 text-indigo-400"
                          : "border-transparent text-[#3a3f50] hover:text-[#7a8099]"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <button
                    onClick={() => setBottomOpen(false)}
                    className="text-[#3a3f50] hover:text-[#7a8099] text-[10px] px-2"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-auto bg-[#080a0d]">
                  {bottomTab === "terminal" && <TerminalPanel />}
                  {bottomTab === "logs" && (
                    <div className="p-3 font-mono text-xs text-[#5a5f6e]">
                      <div className="text-amber-400">[warn] No active build</div>
                      <div>[info] Server started on :3000</div>
                    </div>
                  )}
                  {bottomTab === "git" && (
                    <div className="p-3 text-xs text-[#5a5f6e]">
                      <div className="text-emerald-400 mb-1">On branch main</div>
                      <div>No staged changes</div>
                    </div>
                  )}
                  {bottomTab === "preview" && (
                    <div className="p-3 text-xs">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Preview server running on :3000
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!bottomOpen && (
              <button
                onClick={() => setBottomOpen(true)}
                className="h-7 border-t border-[#181b22] flex items-center justify-center gap-1.5 text-[10px] text-[#3a3f50] hover:text-[#7a8099] hover:bg-white/2 transition-colors shrink-0"
              >
                <Terminal className="w-3 h-3" /> Open terminal
              </button>
            )}
          </div>
        )}

        {/* ── Right: AI build chat ── */}
        <div className="w-80 flex flex-col border-l border-[#181b22] shrink-0">
          <div className="flex items-center gap-2 h-9 px-3 border-b border-[#181b22] shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-medium text-[#c8cdd8]">Build with AI</span>
            <div className="ml-auto flex items-center gap-1">
              <span className="text-[10px] text-[#3a3f50]">claude-sonnet-4-6</span>
            </div>
          </div>

          {/* Landing: what can it build */}
          {showLanding && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#3a3f50] font-medium mb-2">What to build</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {BUILD_TARGETS.map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      onClick={() => sendMessage(`Create a ${label.toLowerCase()}`)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[#1e2130] hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-colors text-center"
                    >
                      <Icon className="w-4 h-4 text-indigo-400" />
                      <span className="text-[9px] text-[#7a8099] leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#3a3f50] font-medium mb-2">Quick commands</p>
                <div className="space-y-1">
                  {QUICK_COMMANDS.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => sendMessage(cmd)}
                      className="w-full text-left text-xs text-[#5a5f6e] hover:text-[#c8cdd8] px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {!showLanding && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[90%] text-xs rounded-xl px-3 py-2 leading-relaxed",
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-[#0f1117] border border-[#1e2130] text-[#c8cdd8]"
                  )}>
                    {msg.content || <Loader2 className="w-3 h-3 animate-spin" />}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          <div className="border-t border-[#181b22] p-3 shrink-0">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(input);
                  }
                }}
                placeholder="Describe what to build…"
                rows={2}
                className="flex-1 bg-[#0f1117] border border-[#1e2130] rounded-lg px-3 py-2 text-xs text-[#c8cdd8] placeholder:text-[#3a3f50] resize-none focus:outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={() => void sendMessage(input)}
                disabled={!input.trim() || loading}
                className="self-end h-8 w-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors shrink-0"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[9px] text-[#3a3f50] mt-1.5">⏎ send · ⇧⏎ new line · API key required</p>
          </div>
        </div>
      </div>
    </div>
  );
}
