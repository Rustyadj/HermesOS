import { create } from "zustand";
import type { CoreModuleId, Project } from "@/types";

type RightPanelTab = "memory" | "files" | "tasks" | "activity";

interface AppState {
  currentModule: CoreModuleId;
  sidebarCollapsed: boolean;
  sidebarExpanded: boolean; // live state from Sidebar (hover or pinned)
  rightPanelOpen: boolean;
  rightPanelTab: RightPanelTab;
  commandBarOpen: boolean;
  activeProject: Project | null;
}

interface AppActions {
  setCurrentModule: (module: CoreModuleId) => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setCommandBarOpen: (open: boolean) => void;
  setActiveProject: (project: Project | null) => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>((set) => ({
  currentModule: "dashboard",
  sidebarCollapsed: false,
  sidebarExpanded: false,
  rightPanelOpen: true,
  rightPanelTab: "activity",
  commandBarOpen: false,
  activeProject: null,

  setCurrentModule: (module) => set({ currentModule: module }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setCommandBarOpen: (open) => set({ commandBarOpen: open }),
  setActiveProject: (project) => set({ activeProject: project }),
}));
