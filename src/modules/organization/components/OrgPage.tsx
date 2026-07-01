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
import { Save, Trash2, Users, Bot, Building2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Custom Node Types ───────────────────────────────────────────────────────

function PersonNode({ data, selected }: { data: Record<string, string>; selected: boolean }) {
  return (
    <div className={cn(
      "bg-[#161920] border rounded-xl p-3 min-w-[160px] shadow-lg transition-all",
      selected ? "border-indigo-500 shadow-indigo-500/20" : "border-[#1e2130]"
    )}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0">
          {data.avatar || "👤"}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#e2e5ed] truncate">{data.label}</div>
          <div className="text-[11px] text-[#7a8099] truncate">{data.title || "Team Member"}</div>
        </div>
      </div>
      {data.department && (
        <div className="mt-2 text-[10px] text-indigo-400 bg-indigo-500/10 rounded-md px-2 py-0.5 inline-block">
          {data.department}
        </div>
      )}
    </div>
  );
}

function AgentNode({ data, selected }: { data: Record<string, string>; selected: boolean }) {
  const statusColor: Record<string, string> = { online: "#10B981", busy: "#F59E0B", idle: "#64748B", offline: "#EF4444" };
  const color = statusColor[data.status] ?? "#64748B";
  return (
    <div className={cn(
      "bg-[#161920] border rounded-xl p-3 min-w-[160px] shadow-lg transition-all",
      selected ? "border-violet-500 shadow-violet-500/20" : "border-[#1e2130]"
    )}>
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg bg-violet-500/10 border border-violet-500/20">
            {data.avatar || "🤖"}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#161920]" style={{ background: color }} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#e2e5ed] truncate">{data.label}</div>
          <div className="text-[11px] text-[#7a8099] truncate">{data.role || "AI Agent"}</div>
        </div>
      </div>
      {data.model && (
        <div className="mt-2 text-[10px] text-violet-400 bg-violet-500/10 rounded-md px-2 py-0.5 inline-block">
          {data.model}
        </div>
      )}
    </div>
  );
}

function DepartmentNode({ data, selected }: { data: Record<string, string>; selected: boolean }) {
  return (
    <div className={cn(
      "bg-[#161920] border-2 border-dashed rounded-2xl px-5 py-3 min-w-[200px] shadow-lg transition-all",
      selected ? "border-cyan-500" : "border-[#2a2f40]"
    )}>
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
        <div className="text-sm font-bold text-[#e2e5ed]">{data.label}</div>
      </div>
      {data.description && (
        <div className="text-[11px] text-[#7a8099] mt-1">{data.description}</div>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  person: PersonNode as never,
  agent: AgentNode as never,
  department: DepartmentNode as never,
};

// ─── Default chart ────────────────────────────────────────────────────────────

const DEFAULT_NODES: Node[] = [
  { id: "dept-1", type: "department", position: { x: 300, y: 20 }, data: { label: "Leadership", description: "Executive team" } },
  { id: "person-1", type: "person", position: { x: 350, y: 130 }, data: { label: "Cash", title: "CEO", avatar: "👔", department: "Executive" } },
  { id: "agent-1", type: "agent", position: { x: 120, y: 260 }, data: { label: "Hermes Lisa", role: "Chief Orchestrator", avatar: "🌸", model: "claude-sonnet-4-6", status: "online" } },
  { id: "agent-2", type: "agent", position: { x: 380, y: 260 }, data: { label: "Hermes Clint", role: "ICF Specialist", avatar: "🏗️", model: "claude-sonnet-4-6", status: "online" } },
  { id: "agent-3", type: "agent", position: { x: 620, y: 260 }, data: { label: "OpenClaw", role: "Research Agent", avatar: "🔍", model: "claude-opus-4-8", status: "idle" } },
];

const DEFAULT_EDGES: Edge[] = [
  { id: "e1", source: "person-1", target: "agent-1", markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: "#3a3f50" }, animated: false },
  { id: "e2", source: "person-1", target: "agent-2", markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: "#3a3f50" } },
  { id: "e3", source: "person-1", target: "agent-3", markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: "#3a3f50" } },
];

// ─── Edit Panel ───────────────────────────────────────────────────────────────

function EditPanel({ node, onUpdate, onDelete, onClose }: {
  node: Node;
  onUpdate: (id: string, data: Record<string, string>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(node.data as Record<string, string>);

  const fields: Record<string, string[]> = {
    person: ["label", "title", "department", "avatar"],
    agent: ["label", "role", "model", "avatar", "status"],
    department: ["label", "description"],
  };

  const nodeFields = fields[node.type as string] ?? ["label"];

  return (
    <div className="absolute right-4 top-4 w-64 bg-[#0f1013] border border-[#1e2130] rounded-xl shadow-2xl p-4 z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-[#e2e5ed] capitalize">{node.type} Properties</div>
        <button onClick={onClose} className="text-[#5a5f6e] hover:text-[#e2e5ed] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2.5">
        {nodeFields.map((field) => (
          <div key={field}>
            <label className="text-[10px] uppercase tracking-wider text-[#5a5f6e] block mb-1 capitalize">{field}</label>
            <input
              value={form[field] ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              className="w-full bg-[#161920] border border-[#1e2130] rounded-lg px-2.5 py-1.5 text-sm text-[#e2e5ed] focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder={field}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => { onUpdate(node.id, form); onClose(); }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg py-1.5 text-xs font-medium transition-colors"
        >
          <Check className="w-3.5 h-3.5" /> Apply
        </button>
        <button
          onClick={() => { onDelete(node.id); onClose(); }}
          className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg px-3 py-1.5 text-xs transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrgPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEFAULT_EDGES);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    fetch("/api/org")
      .then((r) => r.json())
      .then((data) => {
        if (data.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
          setNodes(data.nodes as Node[]);
          setEdges(data.edges as Edge[]);
        }
      })
      .catch(() => {});
  }, [setNodes, setEdges]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({
      ...connection,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#3a3f50" },
    }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  function addNode(type: "person" | "agent" | "department") {
    const defaults: Record<string, Record<string, string>> = {
      person: { label: "New Person", title: "Role", avatar: "👤", department: "" },
      agent: { label: "New Agent", role: "Assistant", avatar: "🤖", model: "claude-sonnet-4-6", status: "online" },
      department: { label: "New Department", description: "" },
    };
    const newNode: Node = {
      id: `${type}-${++idRef.current}`,
      type,
      position: { x: 200 + Math.random() * 300, y: 200 + Math.random() * 200 },
      data: defaults[type],
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

  async function saveChart() {
    setSaving(true);
    try {
      await fetch("/api/org", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full w-full relative">
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
        defaultEdgeOptions={{ style: { stroke: "#3a3f50", strokeWidth: 1.5 } }}
        style={{ background: "#ECEEF2" }}
      >
        <Background color="#d0d3db" gap={20} size={1} />
        <Controls className="!bg-[#0f1013] !border-[#1e2130] !rounded-xl [&>button]:!bg-[#0f1013] [&>button]:!border-[#1e2130] [&>button]:!text-[#7a8099] [&>button:hover]:!bg-[#161920]" />
        <MiniMap
          nodeColor={(n) => n.type === "agent" ? "#7c3aed" : n.type === "department" ? "#06b6d4" : "#6366f1"}
          className="!bg-[#0f1013] !border-[#1e2130] !rounded-xl"
        />

        {/* Top toolbar */}
        <Panel position="top-left">
          <div className="flex items-center gap-2 bg-[#0f1013] border border-[#1e2130] rounded-xl p-2 shadow-xl">
            <span className="text-xs text-[#5a5f6e] px-1">Add:</span>
            <button onClick={() => addNode("person")} className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors">
              <Users className="w-3.5 h-3.5" /> Person
            </button>
            <button onClick={() => addNode("agent")} className="flex items-center gap-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors">
              <Bot className="w-3.5 h-3.5" /> Agent
            </button>
            <button onClick={() => addNode("department")} className="flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors">
              <Building2 className="w-3.5 h-3.5" /> Dept
            </button>
            <div className="w-px h-5 bg-[#1e2130] mx-0.5" />
            <button
              onClick={saveChart}
              disabled={saving}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                saved
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-[#161920] hover:bg-[#1e2130] text-[#7a8099] hover:text-[#e2e5ed]"
              )}
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving…" : saved ? "Saved" : "Save"}
            </button>
          </div>
        </Panel>
      </ReactFlow>

      {/* Edit panel */}
      {selectedNode && (
        <EditPanel
          node={selectedNode}
          onUpdate={updateNode}
          onDelete={deleteNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
