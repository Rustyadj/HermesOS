import { create } from "zustand";
import type { Agent, AgentStatus } from "@/types";
import { AGENT_TEMPLATES } from "@/lib/constants";

interface AgentState {
  agents: Agent[];
  activeAgents: string[];
  supervisorEnabled: boolean;
}

interface AgentActions {
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  toggleAgent: (agentId: string) => void;
  setSupervisor: (enabled: boolean) => void;
}

type AgentStore = AgentState & AgentActions;

// Seed agents from templates with status 'online'
const seedAgents: Agent[] = AGENT_TEMPLATES.map((template) => ({
  ...template,
  status: "online" as AgentStatus,
}));

export const useAgentStore = create<AgentStore>((set) => ({
  // State
  agents: seedAgents,
  activeAgents: seedAgents.map((a) => a.id),
  supervisorEnabled: true,

  // Actions
  addAgent: (agent) =>
    set((state) => ({
      agents: [...state.agents, agent],
    })),

  removeAgent: (agentId) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== agentId),
      activeAgents: state.activeAgents.filter((id) => id !== agentId),
    })),

  updateAgentStatus: (agentId, status) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, status } : a
      ),
    })),

  toggleAgent: (agentId) =>
    set((state) => {
      const isActive = state.activeAgents.includes(agentId);
      return {
        activeAgents: isActive
          ? state.activeAgents.filter((id) => id !== agentId)
          : [...state.activeAgents, agentId],
      };
    }),

  setSupervisor: (enabled) => set({ supervisorEnabled: enabled }),
}));
