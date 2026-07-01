"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  BookOpen,
  Brain,
  Wand2,
  Shield,
  GitBranch,
  Kanban,
  Network,
  BarChart3,
  Settings,
  Cpu,
  Pin,
  PinOff,
  Sparkles,
  DollarSign,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { moduleRegistry } from "@/lib/modules";
import { useAgentStore } from "@/store/useAgentStore";
import { useAppStore } from "@/store/useAppStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { STATUS_COLORS } from "@/lib/constants";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  MessageSquare,
  Bot,
  BookOpen,
  Brain,
  Wand2,
  Shield,
  GitBranch,
  Kanban,
  Network,
  BarChart3,
  Settings,
  Sparkles,
  Cpu,
};

export function Sidebar() {
  const pathname = usePathname();
  const { agents } = useAgentStore();
  const { setSidebarExpanded } = useAppStore();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const expanded = pinned || hovered;

  useEffect(() => {
    setSidebarExpanded(expanded);
  }, [expanded, setSidebarExpanded]);

  const onlineCount = agents.filter((a) => a.status === "online").length;
  const navModules = moduleRegistry.getNav();
  const bottomModules = moduleRegistry.getBottom();

  const coreNav = navModules.filter((m) => m.category === "core");
  const installableNav = navModules.filter((m) => m.category === "installable");

  // Find Hermes Lisa for status card
  const lisaAgent = agents.find((a) => a.id === "hermes-lisa") ?? agents[0];

  function handleMouseEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered(true);
  }

  function handleMouseLeave() {
    leaveTimer.current = setTimeout(() => setHovered(false), 120);
  }

  function NavItem({ mod }: { mod: ReturnType<typeof moduleRegistry.getNav>[number] }) {
    const Icon = ICON_MAP[mod.icon] ?? LayoutDashboard;
    const isActive = pathname.startsWith(mod.href);

    if (!expanded) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={mod.href}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-colors",
                isActive
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-[#5a5f6e] hover:bg-white/5 hover:text-[#c8cdd8]"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">{mod.label}</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        href={mod.href}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap overflow-hidden",
          isActive
            ? "bg-indigo-500/15 text-indigo-400"
            : "text-[#7a8099] hover:bg-white/5 hover:text-[#c8cdd8]"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{mod.label}</span>
      </Link>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: expanded ? 224 : 56,
          transition: "width 180ms cubic-bezier(0.4, 0, 0.2, 1)",
          minWidth: expanded ? 224 : 56,
        }}
        className="flex flex-col h-full border-r border-[#181b22] bg-[#0c0e12] shrink-0 overflow-hidden z-20"
      >
        {/* Logo — only visible when expanded; TopBar shows it when collapsed */}
        <div className="flex items-center h-14 border-b border-[#181b22] px-3 shrink-0 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 shrink-0">
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          {expanded && (
            <div className="ml-2.5 overflow-hidden">
              <div className="text-sm font-semibold text-[#e2e5ed] leading-none whitespace-nowrap">
                Sentinel OS
              </div>
              <div className="text-[10px] text-[#5a5f6e] leading-none mt-0.5 whitespace-nowrap">
                Mission Control
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
          {coreNav.map((mod) => (
            <NavItem key={mod.id} mod={mod} />
          ))}

          {installableNav.length > 0 && (
            <>
              <div className={cn("my-2 border-t border-[#181b22]", !expanded && "mx-2")} />
              {expanded && (
                <div className="px-3 pb-1">
                  <span className="text-[9px] uppercase tracking-widest text-[#3a3f50] font-medium">
                    Modules
                  </span>
                </div>
              )}
              {installableNav.map((mod) => (
                <NavItem key={mod.id} mod={mod} />
              ))}
            </>
          )}
        </nav>

        {/* Hermes Lisa status card — Phase 8 */}
        {lisaAgent && (
          <div className="border-t border-[#181b22] px-2 py-2">
            {expanded ? (
              <div className="bg-[#0f1117] border border-[#1e2130] rounded-xl p-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm border border-[#1e2130] shrink-0"
                    style={{ backgroundColor: lisaAgent.color + "22" }}
                  >
                    {lisaAgent.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-[#c8cdd8] truncate">{lisaAgent.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[lisaAgent.status] ?? "#64748B" }}
                      />
                      <span className="text-[10px] text-[#5a5f6e] capitalize">{lisaAgent.status}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#3a3f50]">Model</span>
                    <span className="text-[#7a8099] truncate ml-2">{lisaAgent.model}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#3a3f50]">Memory</span>
                    <span className="text-[#7a8099]">{lisaAgent.memoryScope}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#3a3f50] flex items-center gap-1">
                      <DollarSign className="w-2.5 h-2.5" />Today
                    </span>
                    <span className="text-emerald-400">$0.12</span>
                  </div>
                </div>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative mx-auto w-fit">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm border border-[#1e2130] cursor-pointer"
                      style={{ backgroundColor: lisaAgent.color + "22" }}
                    >
                      {lisaAgent.avatar}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0c0e12]"
                      style={{ backgroundColor: STATUS_COLORS[lisaAgent.status] ?? "#64748B" }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {lisaAgent.name} · {lisaAgent.status}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Bottom: settings + pin toggle */}
        <div className="border-t border-[#181b22] px-2 py-2 space-y-0.5">
          {bottomModules.map((mod) => (
            <NavItem key={mod.id} mod={mod} />
          ))}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setPinned((p) => !p)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full",
                  pinned
                    ? "text-indigo-400 bg-indigo-500/10"
                    : "text-[#3a3f50] hover:bg-white/5 hover:text-[#7a8099]",
                  !expanded && "justify-center px-0"
                )}
              >
                {pinned ? <PinOff className="w-3.5 h-3.5 shrink-0" /> : <Pin className="w-3.5 h-3.5 shrink-0" />}
                {expanded && (
                  <span className="text-xs whitespace-nowrap">
                    {pinned ? "Unpin sidebar" : "Pin open"}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent side="right" className="text-xs">
                {pinned ? "Unpin sidebar" : "Pin open"}
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
