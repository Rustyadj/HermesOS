import { create } from "zustand";
import type { Memory, MemoryType, MemoryScope } from "@/types";

interface MemoryFilter {
  scope: MemoryScope | "all";
  type: MemoryType | "all";
  search: string;
}

interface MemoryState {
  memories: Memory[];
  filter: MemoryFilter;
}

interface MemoryActions {
  addMemory: (memory: Memory) => void;
  updateMemory: (memoryId: string, updates: Partial<Memory>) => void;
  deleteMemory: (memoryId: string) => void;
  pinMemory: (memoryId: string, pinned: boolean) => void;
  archiveMemory: (memoryId: string, archived: boolean) => void;
  setFilter: (filter: Partial<MemoryFilter>) => void;
}

type MemoryStore = MemoryState & MemoryActions;

const now = new Date();

const sampleMemories: Memory[] = [
  {
    id: "mem-001",
    type: "instruction",
    scope: "org",
    owner: "hermes-lisa",
    content:
      "Always format code responses with TypeScript first. The team prefers strict typing and functional programming patterns over class-based approaches.",
    tags: ["coding", "typescript", "preferences", "team"],
    confidence: 0.95,
    importanceScore: 0.9,
    source: "user-instruction",
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    pinned: true,
    archived: false,
  },
  {
    id: "mem-002",
    type: "decision",
    scope: "project",
    owner: "claude-code",
    content:
      "Decided to use Zustand v5 with the new create() API instead of Redux. State is split into domain stores: app, agents, chat, memory. No middleware initially.",
    tags: ["architecture", "state-management", "zustand", "hermesos"],
    confidence: 1.0,
    importanceScore: 0.85,
    source: "chat:mission-control-main",
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    pinned: false,
    archived: false,
  },
  {
    id: "mem-003",
    type: "fact",
    scope: "agent",
    owner: "openclaw",
    content:
      "Next.js 16 App Router uses React Server Components by default. Client components require the 'use client' directive. Server Actions can be used for mutations without API routes.",
    tags: ["nextjs", "react", "server-components", "technical"],
    confidence: 0.98,
    importanceScore: 0.75,
    source: "research:openclaw",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    pinned: false,
    archived: false,
  },
  {
    id: "mem-004",
    type: "workflow",
    scope: "org",
    owner: "hermes-lisa",
    content:
      "Standard escalation workflow: User request → Hermes Lisa (orchestration) → Delegate to specialist agent → Aggregate results → Return synthesized response. For security tasks, always involve Blue Defender for review.",
    tags: ["workflow", "orchestration", "escalation", "security"],
    confidence: 1.0,
    importanceScore: 0.95,
    source: "system-configuration",
    createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    pinned: true,
    archived: false,
  },
  {
    id: "mem-005",
    type: "pattern",
    scope: "session",
    owner: "claude-code",
    content:
      "User frequently requests component extraction after initial implementation. Pattern: build monolithic first, then extract reusable components in follow-up. Prioritize readability over premature abstraction.",
    tags: ["pattern", "refactoring", "components", "user-behavior"],
    confidence: 0.78,
    importanceScore: 0.6,
    source: "behavioral-inference",
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
    pinned: false,
    archived: false,
  },
];

export const useMemoryStore = create<MemoryStore>((set) => ({
  // State
  memories: sampleMemories,
  filter: {
    scope: "all",
    type: "all",
    search: "",
  },

  // Actions
  addMemory: (memory) =>
    set((state) => ({
      memories: [memory, ...state.memories],
    })),

  updateMemory: (memoryId, updates) =>
    set((state) => ({
      memories: state.memories.map((m) =>
        m.id === memoryId ? { ...m, ...updates, updatedAt: new Date() } : m
      ),
    })),

  deleteMemory: (memoryId) =>
    set((state) => ({
      memories: state.memories.filter((m) => m.id !== memoryId),
    })),

  pinMemory: (memoryId, pinned) =>
    set((state) => ({
      memories: state.memories.map((m) =>
        m.id === memoryId ? { ...m, pinned, updatedAt: new Date() } : m
      ),
    })),

  archiveMemory: (memoryId, archived) =>
    set((state) => ({
      memories: state.memories.map((m) =>
        m.id === memoryId ? { ...m, archived, updatedAt: new Date() } : m
      ),
    })),

  setFilter: (filter) =>
    set((state) => ({
      filter: { ...state.filter, ...filter },
    })),
}));

// Selector helpers
export const selectFilteredMemories = (state: MemoryStore): Memory[] => {
  const { memories, filter } = state;
  return memories.filter((m) => {
    if (m.archived) return false;
    if (filter.scope !== "all" && m.scope !== filter.scope) return false;
    if (filter.type !== "all" && m.type !== filter.type) return false;
    if (
      filter.search &&
      !m.content.toLowerCase().includes(filter.search.toLowerCase()) &&
      !m.tags.some((t) =>
        t.toLowerCase().includes(filter.search.toLowerCase())
      )
    ) {
      return false;
    }
    return true;
  });
};

export const selectPinnedMemories = (state: MemoryStore): Memory[] =>
  state.memories.filter((m) => m.pinned && !m.archived);
