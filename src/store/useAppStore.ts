import { create } from "zustand";
import type { Project } from "@/types";

type RightPanelTab = "memory" | "files" | "tasks" | "activity";

interface AppState {
  rightPanelOpen: boolean;
  rightPanelTab: RightPanelTab;
  commandBarOpen: boolean;
  activeProject: Project | null;
}

interface AppActions {
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setCommandBarOpen: (open: boolean) => void;
  setActiveProject: (project: Project | null) => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>((set) => ({
  rightPanelOpen: false,
  rightPanelTab: "activity",
  commandBarOpen: false,
  activeProject: null,

  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setCommandBarOpen: (open) => set({ commandBarOpen: open }),
  setActiveProject: (project) => set({ activeProject: project }),
}));
