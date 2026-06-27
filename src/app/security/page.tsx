"use client";

import { useState } from "react";
import { Shield, AlertTriangle, Eye, Target, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function SecurityPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[--foreground]">Security Center</h1>
          <p className="text-sm text-[--muted-foreground] mt-0.5">
            Red · Blue · Purple team operations and audit log
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            All actions logged
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <SecurityStat label="Open Findings" value={7} color="#EF4444" icon={AlertTriangle} delta="-2 from last week" />
        <SecurityStat label="Controls Passing" value={34} color="#10B981" icon={CheckCircle2} delta="94% coverage" />
        <SecurityStat label="Tests Run" value={128} color="#3B82F6" icon={Target} delta="this sprint" />
        <SecurityStat label="Audit Events" value={2841} color="#F59E0B" icon={Activity} delta="last 30 days" />
      </div>

      {/* Teams */}
      <Tabs defaultValue="red">
        <TabsList className="w-full justify-start bg-[--muted] mb-4">
          <TabsTrigger value="red" className="gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Red Team
          </TabsTrigger>
          <TabsTrigger value="blue" className="gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Blue Team
          </TabsTrigger>
          <TabsTrigger value="purple" className="gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            Purple Team
          </TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="red">
          <RedTeamPanel />
        </TabsContent>
        <TabsContent value="blue">
          <BlueTeamPanel />
        </TabsContent>
        <TabsContent value="purple">
          <PurpleTeamPanel />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SecurityStat({ label, value, color, icon: Icon, delta }: {
  label: string; value: number; color: string; icon: React.ComponentType<{ className?: string }>; delta: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-[--foreground]">{value}</div>
        <div className="text-xs text-[--muted-foreground] mt-0.5">{label}</div>
        <div className="text-[11px] text-[--muted-foreground] mt-1 opacity-70">{delta}</div>
      </CardContent>
    </Card>
  );
}

function RedTeamPanel() {
  const findings = [
    { id: "R-001", title: "Prompt injection in agent input parsing", severity: "high", status: "open", technique: "T1190" },
    { id: "R-002", title: "Tool permission escalation via crafted payload", severity: "critical", status: "open", technique: "T1068" },
    { id: "R-003", title: "Memory store accessible without scope check", severity: "medium", status: "in-progress", technique: "T1005" },
    { id: "R-004", title: "WebSocket auth missing on reconnect", severity: "high", status: "open", technique: "T1557" },
    { id: "R-005", title: "Agent API key exposure in logs", severity: "medium", status: "resolved", technique: "T1552" },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Open Findings
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {findings.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-2 border-b border-[--border] last:border-0">
                <SeverityBadge severity={f.severity} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[--foreground] truncate">{f.title}</div>
                  <div className="text-[10px] text-[--muted-foreground] font-mono">{f.technique}</div>
                </div>
                <StatusPill status={f.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Planned Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {[
            { name: "Prompt Injection Suite", progress: 65, status: "running" },
            { name: "Auth Bypass Tests", progress: 100, status: "complete" },
            { name: "Tool Permission Audit", progress: 30, status: "running" },
            { name: "Memory Scope Tests", progress: 0, status: "queued" },
          ].map((test) => (
            <div key={test.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[--foreground]">{test.name}</span>
                <span className={cn("text-[10px]",
                  test.status === "complete" ? "text-emerald-400" :
                  test.status === "running" ? "text-amber-400" : "text-[--muted-foreground]"
                )}>
                  {test.status}
                </span>
              </div>
              <Progress value={test.progress} className="h-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function BlueTeamPanel() {
  const controls = [
    { name: "Agent input sanitization", status: "passing", category: "Input Validation" },
    { name: "Tool permission enforcement", status: "warning", category: "Access Control" },
    { name: "Audit log completeness", status: "passing", category: "Logging" },
    { name: "Memory scope isolation", status: "failing", category: "Data Protection" },
    { name: "API key rotation policy", status: "passing", category: "Credential Management" },
    { name: "WebSocket auth validation", status: "warning", category: "Authentication" },
    { name: "Rate limiting on agent calls", status: "passing", category: "Availability" },
    { name: "Sensitive data redaction", status: "passing", category: "Data Protection" },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {controls.map((c) => (
              <div key={c.name} className="flex items-center gap-3 py-2 border-b border-[--border] last:border-0">
                <ControlStatusIcon status={c.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[--foreground] truncate">{c.name}</div>
                  <div className="text-[10px] text-[--muted-foreground]">{c.category}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {[
            { label: "Control Coverage", value: 87 },
            { label: "Log Completeness", value: 100 },
            { label: "Alert Response Rate", value: 94 },
            { label: "Patch Compliance", value: 72 },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[--foreground]">{label}</span>
                <span className="text-xs text-[--muted-foreground]">{value}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[--muted] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${value}%`,
                    backgroundColor: value >= 90 ? "#10B981" : value >= 70 ? "#F59E0B" : "#EF4444",
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PurpleTeamPanel() {
  const exercises = [
    { id: "PE-01", name: "Prompt injection exercise", redFindings: 2, blueMitigations: 1, status: "in-progress" },
    { id: "PE-02", name: "Privilege escalation simulation", redFindings: 1, blueMitigations: 1, status: "complete" },
    { id: "PE-03", name: "Data exfiltration scenario", redFindings: 3, blueMitigations: 2, status: "scheduled" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-purple-400 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Purple Team Exercises
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {exercises.map((ex) => (
            <div key={ex.id} className="p-4 rounded-lg border border-[--border] bg-[--muted]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-[--foreground]">{ex.name}</div>
                  <div className="text-[10px] text-[--muted-foreground] font-mono">{ex.id}</div>
                </div>
                <StatusPill status={ex.status} />
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-[10px] text-red-400 mb-0.5">Red Findings</div>
                  <div className="text-lg font-bold text-red-400">{ex.redFindings}</div>
                </div>
                <div className="h-8 w-px bg-[--border]" />
                <div>
                  <div className="text-[10px] text-blue-400 mb-0.5">Blue Mitigations</div>
                  <div className="text-lg font-bold text-blue-400">{ex.blueMitigations}</div>
                </div>
                <div className="h-8 w-px bg-[--border]" />
                <div>
                  <div className="text-[10px] text-[--muted-foreground] mb-0.5">Coverage</div>
                  <div className="text-lg font-bold text-[--foreground]">
                    {Math.round((ex.blueMitigations / ex.redFindings) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AuditLogPanel() {
  const events = [
    { id: "AE-001", agent: "Hermes Lisa", action: "memory.write", details: "Saved project context to org scope", time: "14:32:01", risk: "low" },
    { id: "AE-002", agent: "Claude Code", action: "tool.execute", details: "Ran code_execution: generate schema", time: "14:28:44", risk: "medium" },
    { id: "AE-003", agent: "Red Teamer", action: "tool.execute", details: "Ran network_scan on 10.0.0.1/24", time: "13:55:12", risk: "high" },
    { id: "AE-004", agent: "System", action: "auth.session", details: "New session created for user rustyadj", time: "13:00:00", risk: "low" },
    { id: "AE-005", agent: "OpenClaw", action: "tool.execute", details: "Web fetch: github.com/anthropics/claude", time: "12:44:30", risk: "low" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Audit Log
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {events.length} events shown
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 py-3 border-b border-[--border] last:border-0">
              <RiskDot risk={event.risk} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-[--foreground]">{event.agent}</span>
                  <code className="text-[10px] text-[--muted-foreground] bg-[--muted] px-1 rounded">{event.action}</code>
                </div>
                <div className="text-[11px] text-[--muted-foreground]">{event.details}</div>
              </div>
              <span className="text-[10px] text-[--muted-foreground] font-mono shrink-0">{event.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide shrink-0", colors[severity] ?? "")}>
      {severity}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "text-red-400",
    "in-progress": "text-amber-400",
    resolved: "text-emerald-400",
    complete: "text-emerald-400",
    scheduled: "text-blue-400",
    queued: "text-[--muted-foreground]",
    running: "text-amber-400",
  };
  return (
    <span className={cn("text-[10px] capitalize shrink-0", colors[status] ?? "text-[--muted-foreground]")}>
      {status}
    </span>
  );
}

function ControlStatusIcon({ status }: { status: string }) {
  if (status === "passing") return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  if (status === "failing") return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
  return <Clock className="w-4 h-4 text-amber-400 shrink-0" />;
}

function RiskDot({ risk }: { risk: string }) {
  const colors: Record<string, string> = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-emerald-500" };
  return <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", colors[risk] ?? "bg-gray-500")} />;
}
