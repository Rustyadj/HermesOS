"use client";

import { useAgentStore } from "@/store/useAgentStore";
import { STATUS_COLORS } from "@/lib/constants";

export default function OrgChartPage() {
  const { agents } = useAgentStore();

  const supervisor = agents.find((a) => a.id === "hermes-lisa");
  const specialists = agents.filter((a) => a.id !== "hermes-lisa");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[--foreground]">Org Chart</h1>
        <p className="text-sm text-[--muted-foreground] mt-0.5">Agent hierarchy and reporting structure</p>
      </div>

      <div className="flex flex-col items-center gap-0 select-none">
        {/* Supervisor */}
        {supervisor && (
          <>
            <AgentNode agent={supervisor} size="lg" />
            <div className="w-px h-8 bg-[--border]" />
            <div className="relative flex items-start gap-12">
              {/* Horizontal line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-[--border]" style={{ width: `calc(${specialists.length} * 160px - 80px)` }} />
              {specialists.map((agent, i) => (
                <div key={agent.id} className="flex flex-col items-center">
                  <div className="w-px h-8 bg-[--border]" />
                  <AgentNode agent={agent} size="md" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="mt-12 flex items-center gap-6 justify-center">
        {(["online", "busy", "idle", "offline"] as const).map((status) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-[--muted-foreground] capitalize">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
            {status}
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentNode({
  agent,
  size,
}: {
  agent: import("@/types").Agent;
  size: "lg" | "md";
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 cursor-default group"
      style={{ minWidth: size === "lg" ? 160 : 140 }}
    >
      <div
        className="relative rounded-2xl flex items-center justify-center border-2 group-hover:scale-105 transition-transform"
        style={{
          width: size === "lg" ? 64 : 52,
          height: size === "lg" ? 64 : 52,
          backgroundColor: agent.color + "22",
          borderColor: agent.color + "66",
          fontSize: size === "lg" ? 28 : 22,
        }}
      >
        {agent.avatar}
        <span
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[--background]"
          style={{ backgroundColor: STATUS_COLORS[agent.status] }}
        />
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold text-[--foreground]">{agent.name}</div>
        <div className="text-[10px] text-[--muted-foreground]">{agent.role}</div>
        <div className="text-[10px] font-mono text-[--muted-foreground] opacity-60">{agent.model}</div>
      </div>
    </div>
  );
}
