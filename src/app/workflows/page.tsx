"use client";

import { useState } from "react";
import { Plus, Play, Pause, GitBranch, Zap, Mail, Database, Globe, CheckSquare, AlertTriangle, RotateCcw, Webhook } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Workflow } from "@/types";

const SAMPLE_WORKFLOWS: Workflow[] = [
  {
    id: "wf-1",
    name: "Lead Research Pipeline",
    description: "Auto-research new leads and enrich CRM data",
    nodes: [],
    edges: [],
    status: "active",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: "wf-2",
    name: "Security Scan Workflow",
    description: "Scheduled prompt injection and permission audit",
    nodes: [],
    edges: [],
    status: "paused",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "wf-3",
    name: "Content Calendar Generator",
    description: "Generate weekly content plan from campaign goals",
    nodes: [],
    edges: [],
    status: "draft",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

const NODE_TYPES = [
  { type: "trigger", label: "Trigger", icon: Zap, color: "#F59E0B" },
  { type: "agent", label: "Agent", icon: GitBranch, color: "#8B5CF6" },
  { type: "http", label: "HTTP Request", icon: Globe, color: "#3B82F6" },
  { type: "email", label: "Email", icon: Mail, color: "#10B981" },
  { type: "database", label: "Database", icon: Database, color: "#06B6D4" },
  { type: "approval", label: "Approval Gate", icon: CheckSquare, color: "#F59E0B" },
  { type: "condition", label: "Condition", icon: AlertTriangle, color: "#EF4444" },
  { type: "loop", label: "Loop", icon: RotateCcw, color: "#6366f1" },
  { type: "webhook", label: "Webhook", icon: Webhook, color: "#EC4899" },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(SAMPLE_WORKFLOWS);
  const [selected, setSelected] = useState<Workflow | null>(null);
  const [canvasMode, setCanvasMode] = useState(false);

  if (canvasMode && selected) {
    return <WorkflowCanvas workflow={selected} onClose={() => setCanvasMode(false)} />;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[--foreground]">Workflows</h1>
          <p className="text-sm text-[--muted-foreground] mt-0.5">
            {workflows.filter((w) => w.status === "active").length} active · {workflows.length} total
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {workflows.map((wf) => (
          <WorkflowCard
            key={wf.id}
            workflow={wf}
            onOpen={() => {
              setSelected(wf);
              setCanvasMode(true);
            }}
          />
        ))}
      </div>

      {/* Node type reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Available Node Types</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {NODE_TYPES.map(({ type, label, icon: Icon, color }) => (
              <div key={type} className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-[--border] bg-[--muted] hover:border-[--primary]/40 transition-colors cursor-default">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                  <Icon className="w-4 h-4" style={{ color } as React.CSSProperties} />
                </div>
                <span className="text-[10px] text-[--muted-foreground] text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkflowCard({ workflow, onOpen }: { workflow: Workflow; onOpen: () => void }) {
  const statusConfig = {
    active: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Play },
    paused: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Pause },
    draft: { color: "text-[--muted-foreground]", bg: "bg-[--muted]", border: "border-[--border]", icon: GitBranch },
  };
  const config = statusConfig[workflow.status];
  const Icon = config.icon;

  return (
    <Card className="hover:border-[--primary]/40 transition-colors cursor-pointer group" onClick={onOpen}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[--foreground] truncate">{workflow.name}</div>
            <div className="text-[11px] text-[--muted-foreground] mt-0.5 line-clamp-2">{workflow.description}</div>
          </div>
          <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-[10px] border shrink-0", config.color, config.bg, config.border)}>
            <Icon className="w-3 h-3" />
            {workflow.status}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[--muted-foreground]">
          <span>{workflow.nodes.length} nodes</span>
          <span>·</span>
          <span>Created {new Date(workflow.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-[--border] flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={(e) => e.stopPropagation()}>
            {workflow.status === "active" ? <><Pause className="w-3 h-3 mr-1" />Pause</> : <><Play className="w-3 h-3 mr-1" />Run</>}
          </Button>
          <Button size="sm" className="flex-1 h-7 text-xs">
            Open Canvas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkflowCanvas({ workflow, onClose }: { workflow: Workflow; onClose: () => void }) {
  const mockNodes = [
    { id: "n1", type: "trigger", label: "Schedule Trigger", x: 80, y: 120, color: "#F59E0B" },
    { id: "n2", type: "agent", label: "OpenClaw Research", x: 280, y: 120, color: "#8B5CF6" },
    { id: "n3", type: "condition", label: "Quality Check", x: 480, y: 120, color: "#EF4444" },
    { id: "n4", type: "database", label: "Save to Memory", x: 680, y: 80, color: "#06B6D4" },
    { id: "n5", type: "email", label: "Send Summary", x: 680, y: 200, color: "#10B981" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-[--border] px-4 h-14 flex items-center gap-3 bg-[--card] shrink-0">
        <button onClick={onClose} className="text-[--muted-foreground] hover:text-[--foreground] text-sm">
          ← Back
        </button>
        <div className="w-px h-4 bg-[--border]" />
        <span className="text-sm font-medium text-[--foreground]">{workflow.name}</span>
        <Badge variant="outline" className="text-[10px]">{workflow.status}</Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
            <Play className="w-3 h-3" />
            Test Run
          </Button>
          <Button size="sm" className="h-7 text-xs">Save</Button>
        </div>
      </div>

      {/* Node palette */}
      <div className="flex">
        <div className="w-48 border-r border-[--border] p-3 bg-[--sidebar] overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-[--muted-foreground] mb-2">Nodes</div>
          <div className="space-y-1">
            {NODE_TYPES.map(({ type, label, icon: Icon, color }) => (
              <div key={type} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-[--accent] transition-colors cursor-grab text-xs text-[--muted-foreground] hover:text-[--foreground]">
                <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: color + "20" }}>
                  <Icon className="w-3 h-3" style={{ color } as React.CSSProperties} />
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 bg-[--background] relative overflow-hidden" style={{ backgroundImage: "radial-gradient(circle, #1e2124 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line x1="176" y1="148" x2="280" y2="148" stroke="#2a2d32" strokeWidth="2" markerEnd="url(#arrow)" />
            <line x1="376" y1="148" x2="480" y2="148" stroke="#2a2d32" strokeWidth="2" />
            <line x1="576" y1="120" x2="680" y2="108" stroke="#2a2d32" strokeWidth="2" />
            <line x1="576" y1="176" x2="680" y2="228" stroke="#2a2d32" strokeWidth="2" />
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#2a2d32" />
              </marker>
            </defs>
          </svg>

          {mockNodes.map((node) => (
            <CanvasNode key={node.id} node={node} />
          ))}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-[--muted-foreground] bg-[--card] border border-[--border] px-3 py-1.5 rounded-full">
            Visual canvas · drag nodes to build your workflow
          </div>
        </div>
      </div>
    </div>
  );
}

function CanvasNode({ node }: { node: { id: string; type: string; label: string; x: number; y: number; color: string } }) {
  const nodeType = NODE_TYPES.find((n) => n.type === node.type);
  const Icon = nodeType?.icon ?? Zap;

  return (
    <div
      className="absolute flex flex-col items-center gap-1 cursor-move select-none"
      style={{ left: node.x, top: node.y, transform: "translate(-50%, -50%)" }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-lg"
        style={{ backgroundColor: node.color + "22", borderColor: node.color + "66" }}
      >
        <Icon className="w-5 h-5" style={{ color: node.color } as React.CSSProperties} />
      </div>
      <div className="text-[10px] text-[--foreground] bg-[--card] border border-[--border] px-2 py-0.5 rounded-full whitespace-nowrap shadow">
        {node.label}
      </div>
    </div>
  );
}
