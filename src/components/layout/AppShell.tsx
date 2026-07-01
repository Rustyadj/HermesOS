"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { RightPanel } from "./RightPanel";
import { CommandPalette } from "./CommandPalette";
import { useAppStore } from "@/store/useAppStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { rightPanelOpen } = useAppStore();

  return (
    <div className="flex h-full w-full overflow-hidden">
      <CommandPalette />
      {/* Left sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* Workspace */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <main className="flex-1 overflow-hidden min-w-0 bg-[--background]">{children}</main>

          {/* Right panel */}
          {rightPanelOpen && <RightPanel />}
        </div>
      </div>
    </div>
  );
}
