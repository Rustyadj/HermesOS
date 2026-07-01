"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeTypes,
  type Node,
  type Edge,
  Panel,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Zap, Bot, GitBranch, Globe, Mail, Database, CheckSquare,
  RefreshCw, Webhook, Plus, Save, Trash2, Play, X, Check,
  ChevronLeft, ChevronRight, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Node palette config ──────────────────────────────────────────────────────

interface NodePaletteDef {
  type: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  defaultData: Record<string, string>;
}

const PALETTE: NodePaletteDef[] = [
  { type: "trigger", label: "Trigger", icon: Zap, color: "#F59E0B", bg: "#F59E0B15", defaultData: { label: "Trigger", triggerType: "webhook", description: "" } },
  { type: "agent", label: "Agent", icon: Bot, color: "#8B5CF6", bg: "#8B5CF615", defaultData: { label: "Agent Step", agentId: "", instruction: "" } },
  { type: "condition", label: "Condition", icon: GitBranch, color: "#06B6D4", bg: "#06B6D415", defaultData: { label: "Condition", expression: "", trueLabel: "Yes", falseLabel: "No" } },
  { type: "http", label: "HTTP", icon: Globe, color: "#3B82F6", bg: "#3B82F615", defaultData: { label: "HTTP Request", method: "GET", url: "", headers: "" } },
  { type: "email", label: "Email", icon: Mail, color: "#10B981", bg: "#10B98115", defaultData: { label: "Send Email", to: "", subject: "", body: "" } },
  { type: "database", label: "Database", icon: Database, color: "#6366f1", bg: "#6366f115", defaultData: { label: "Database", query: "", collection: "" } },
  { type: "approval", label: "Approval", icon: CheckSquare, color: "#EF4444", bg: "#EF444415", defaultData: { label: "Approval Gate", assignee: "", message: "" } },
  { type: "loop", label: "Loop", icon: RefreshCw, color: "#64748B", bg: "#64748B15", defaultData: { label: "Loop", iterations: "10", breakCondition: "" } },
  { type: "webhook", label: "Webhook", icon: Webhook, color: "#F97316", bg: "#F9731615", defaultData: { label: "Webhook Out", url: "", method: "POST" } },
];

// ─── Generic workflow node renderer ──────────────────────────────────────────

function WorkflowNodeComponent({ data, selected, type }: { data: Record<string, string>; selected: boolean; type: string }) {
  const palette = PALETTE.find((p) => p.type === type) ?? PALETTE[0];
  const Icon = palette.icon;

  return (
    <div
      className={cn(
        "bg-[#161920] border rounded-xl p-3 min-w-[160px] max-w-[220px] shadow-lg transition-all",
        selected ? "shadow-lg ring-1" : "border-[#1e2130]"
      )}
      style={selected ? { borderColor: palette.color, boxShadow: `0 0 0 1px ${palette.color}40` } : {}}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: palette.bg }}>
          <Icon className="w-3.5 h-3.5" style={{ color: palette.color }} />
        </div>
        <div className="text-xs font-semibold text-[#e2e5ed] truncate">{data.label || palette.label}</div>
      </div>
      {data.description && <div className="text-[10px] text-[#5a5f6e] truncate">{data.description}</div>}
      {data.triggerType && <div className="text-[10px] text-amber-400 mt-1">{data.triggerType}</div>}
      {data.url && <div className="text-[10px] text-blue-400 mt-1 truncate">{data.url}</div>}
      {data.expression && <div className="text-[10px] text-cyan-400 mt-1 truncate font-mono">{data.expression}</div>}
      {data.method && type === "http" && <div className="text-[10px] text-blue-400 mt-1 font-mono">{data.method}</div>}
    </div>
  );
}

// Build nodeTypes from palette
const nodeTypes: NodeTypes = Object.fromEntries(
  PALETTE.map((p) => [
    p.type,
    ({ data, selected }: { data: Record<string, string>; selected: boolean }) =>
      <WorkflowNodeComponent data={data} selected={selected} type={p.type} />,
  ])
) as NodeTypes;

// ─── Config fields per node type ──────────────────────────────────────────────

const NODE_FIELDS: Record<string, { key: string; label: string; type?: string }[]> = {
  trigger: [
    { key: "label", label: "Label" },
    { key: "triggerType", label: "Type (webhook/schedule/event)" },
    { key: "description", label: "Description" },
  ],
  agent: [
    { key: "label", label: "Label" },
    { key: "agentId", label: "Agent" },
    { key: "instruction", label: "Instruction", type: "textarea" },
  ],
  condition: [
    { key: "label", label: "Label" },
    { key: "expression", label: "Expression" },
    { key: "trueLabel", label: "True branch label" },
    { key: "falseLabel", label: "False branch label" },
  ],
  http: [
    { key: "label", label: "Label" },
    { key: "method", label: "Method (GET/POST/PUT/DELETE)" },
    { key: "url", label: "URL" },
    { key: "headers", label: "Headers (JSON)" },
  ],
  email: [
    { key: "label", label: "Label" },
    { key: "to", label: "To" },
    { key: "subject", label: "Subject" },
    { key: "body", label: "Body", type: "textarea" },
  ],
  database: [
    { key: "label", label: "Label" },
    { key: "collection", label: "Table / Collection" },
    { key: "query", label: "Query", type: "textarea" },
  ],
  approval: [
    { key: "label", label: "Label" },
    { key: "assignee", label: "Assignee" },
    { key: "message", label: "Message" },
  ],
  loop: [
    { key: "label", label: "Label" },
    { key: "iterations", label: "Max iterations" },
    { key: "breakCondition", label: "Break condition" },
  ],
  webhook: [
    { key: "label", label: "Label" },
    { key: "url", label: "Webhook URL" },
    { key: "method", label: "Method" },
  ],
};

// ─── Config panel ─────────────────────────────────────────────────────────────

function ConfigPanel({ node, onUpdate, onDelete, onClose }: {
  node: Node;
  onUpdate: (id: string, data: Record<string, string>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(node.data as Record<string, string>);
  const palette = PALETTE.find((p) => p.type === node.type) ?? PALETTE[0];
  const fields = NODE_FIELDS[node.type as string] ?? [{ key: "label", label: "Label" }];

  return (
    <div className="absolute right-4 top-4 w-72 bg-[#0f1013] border border-[#1e2130] rounded-xl shadow-2xl z-10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130]" style={{ borderLeftColor: palette.color, borderLeftWidth: 3 }}>
        <div className="flex items-center gap-2">
          <palette.icon className="w-4 h-4" style={{ color: palette.color }} />
          <span className="text-sm font-semibold text-[#e2e5ed]">{palette.label}</span>
        </div>
        <button onClick={onClose} className="text-[#5a5f6e] hover:text-[#e2e5ed] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="text-[10px] uppercase tracking-wider text-[#5a5f6e] block mb-1">{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                rows={3}
                className="w-full bg-[#161920] border border-[#1e2130] rounded-lg px-2.5 py-1.5 text-sm text-[#e2e5ed] focus:outline-none focus:border-indigo-500 transition-colors resize-none font-mono text-xs"
              />
            ) : (
              <input
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                className="w-full bg-[#161920] border border-[#1e2130] rounded-lg px-2.5 py-1.5 text-sm text-[#e2e5ed] focus:outline-none focus:border-indigo-500 transition-colors"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-4 border-t border-[#1e2130]">
        <button
          onClick={() => { onUpdate(node.id, form); onClose(); }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg py-2 text-xs font-medium transition-colors"
        >
          <Check className="w-3.5 h-3.5" /> Apply
        </button>
        <button
          onClick={() => { onDelete(node.id); onClose(); }}
          className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg px-3 py-2 text-xs transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Workflow list sidebar ────────────────────────────────────────────────────

interface WorkflowRecord {
  id: string;
  name: string;
  status: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
}

function WorkflowList({ workflows, activeId, onSelect, onCreate }: {
  workflows: WorkflowRecord[];
  activeId: string | null;
  onSelect: (w: WorkflowRecord) => void;
  onCreate: () => void;
}) {
  const statusColor: Record<string, string> = { draft: "#64748B", active: "#10B981", paused: "#F59E0B" };

  return (
    <div className="w-56 bg-[#0f1013] border-r border-[#1e2130] flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#1e2130]">
        <span className="text-xs font-semibold text-[#7a8099] uppercase tracking-wider">Workflows</span>
        <button onClick={onCreate} className="w-6 h-6 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 flex items-center justify-center text-indigo-400 transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {workflows.map((w) => (
          <button
            key={w.id}
            onClick={() => onSelect(w)}
            className={cn(
              "w-full text-left px-3 py-2.5 transition-colors",
              activeId === w.id ? "bg-indigo-500/10 text-[#e2e5ed]" : "text-[#7a8099] hover:bg-[#161920] hover:text-[#c8cdd8]"
            )}
          >
            <div className="text-sm truncate">{w.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor[w.status] ?? "#64748B" }} />
              <span className="text-[10px] capitalize">{w.status}</span>
              <span className="text-[10px] text-[#3a3f50]">· {w.nodes?.length ?? 0} nodes</span>
            </div>
          </button>
        ))}
        {workflows.length === 0 && (
          <div className="px-3 py-4 text-xs text-[#3a3f50] text-center">No workflows yet</div>
        )}
      </div>
    </div>
  );
}

// ─── Main WorkflowsPage ───────────────────────────────────────────────────────

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowRecord | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const idRef = useRef(0);

  function loadWorkflow(w: WorkflowRecord) {
    setActiveWorkflow(w);
    setNodes((w.nodes as Node[]) ?? []);
    setEdges((w.edges as Edge[]) ?? []);
    setSelectedNode(null);
  }

  // Load workflows on mount
  useEffect(() => {
    fetch("/api/workflows")
      .then((r) => r.json())
      .then((data: WorkflowRecord[]) => {
        setWorkflows(data);
        if (data.length > 0) loadWorkflow(data[0]);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createWorkflow() {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Workflow", nodes: [], edges: [] }),
    });
    const w = (await res.json()) as WorkflowRecord;
    setWorkflows((prev) => [w, ...prev]);
    loadWorkflow(w);
  }

  async function saveWorkflow() {
    if (!activeWorkflow) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/workflows/${activeWorkflow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeWorkflow.name,
          description: activeWorkflow.description ?? "",
          nodes,
          edges,
          status: activeWorkflow.status,
        }),
      });
      const updated = (await res.json()) as WorkflowRecord;
      setWorkflows((prev) => prev.map((w) => w.id === updated.id ? { ...updated, nodes, edges } : w));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({
      ...connection,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#3a3f50", strokeWidth: 1.5 },
      animated: true,
    }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  function addNode(paletteDef: NodePaletteDef) {
    const newNode: Node = {
      id: `${paletteDef.type}-${++idRef.current}`,
      type: paletteDef.type,
      position: { x: 200 + (idRef.current % 6) * 60, y: 100 + (idRef.current % 4) * 60 },
      data: { ...paletteDef.defaultData },
    };
    setNodes((nds) => [...nds, newNode]);
  }

  function updateNode(id: string, data: Record<string, string>) {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data } : n));
  }

  function deleteNode(id: string) {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }

  if (!activeWorkflow && workflows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-10 h-10 text-[#3a3f50] mx-auto mb-3" />
          <div className="text-sm text-[#7a8099] mb-4">No workflows yet</div>
          <button onClick={createWorkflow} className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg px-4 py-2 text-sm font-medium transition-colors mx-auto">
            <Plus className="w-4 h-4" /> Create Workflow
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Workflow list */}
      {sidebarOpen && (
        <WorkflowList
          workflows={workflows}
          activeId={activeWorkflow?.id ?? null}
          onSelect={loadWorkflow}
          onCreate={createWorkflow}
        />
      )}

      {/* Canvas */}
      <div className="flex-1 relative min-w-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          style={{ background: "#ECEEF2" }}
          defaultEdgeOptions={{ animated: true, style: { stroke: "#3a3f50", strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed } }}
        >
          <Background color="#d0d3db" gap={20} size={1} />
          <Controls className="!bg-[#0f1013] !border-[#1e2130] !rounded-xl [&>button]:!bg-[#0f1013] [&>button]:!border-[#1e2130] [&>button]:!text-[#7a8099] [&>button:hover]:!bg-[#161920]" />
          <MiniMap nodeColor={() => "#6366f1"} className="!bg-[#0f1013] !border-[#1e2130] !rounded-xl" />

          {/* Top toolbar */}
          <Panel position="top-left">
            <div className="flex items-center gap-2 bg-[#0f1013] border border-[#1e2130] rounded-xl p-2 shadow-xl flex-wrap">
              <button
                onClick={() => setSidebarOpen((o) => !o)}
                className="w-7 h-7 rounded-md hover:bg-[#161920] flex items-center justify-center text-[#5a5f6e] hover:text-[#e2e5ed] transition-colors"
              >
                {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              <div className="w-px h-5 bg-[#1e2130]" />
              {PALETTE.map((p) => (
                <button
                  key={p.type}
                  onClick={() => addNode(p)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors hover:opacity-90"
                  style={{ background: p.bg, color: p.color }}
                  title={p.label}
                >
                  <p.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              ))}
              <div className="w-px h-5 bg-[#1e2130]" />
              <button
                onClick={saveWorkflow}
                disabled={saving || !activeWorkflow}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  saved ? "bg-emerald-500/20 text-emerald-400" : "bg-[#161920] hover:bg-[#1e2130] text-[#7a8099] hover:text-[#e2e5ed]"
                )}
              >
                {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? "Saving…" : saved ? "Saved" : "Save"}
              </button>
              <button className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors">
                <Play className="w-3.5 h-3.5" /> Run
              </button>
            </div>
          </Panel>
        </ReactFlow>

        {/* Config panel */}
        {selectedNode && (
          <ConfigPanel
            node={selectedNode}
            onUpdate={updateNode}
            onDelete={deleteNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}
