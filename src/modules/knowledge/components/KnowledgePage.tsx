"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ReactFlow,
  Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  type Node, type Edge,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Search, Plus, FileText, Calendar, Folder,
  Save, Trash2, Eye, Edit3, GitBranch, BookOpen,
  ChevronDown, ChevronRight, Loader2, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NoteStub {
  id: string;
  title: string;
  tags: string[];
  backlinks: string[];
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Note extends NoteStub {
  content: string;
}

interface ProjectStub {
  id: string;
  name: string;
}

// ─── Wiki link preprocessing ──────────────────────────────────────────────────

function preprocessWikiLinks(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, "`[[$1]]`");
}

// ─── Graph Node components ────────────────────────────────────────────────────

function NoteGraphNode({ data, selected }: { data: { label: string; tags: string[] }; selected: boolean }) {
  return (
    <div className={cn(
      "bg-[#161920] border rounded-xl px-3 py-2 text-xs shadow-lg transition-all max-w-[160px]",
      selected ? "border-indigo-500" : "border-[#1e2130]"
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        <FileText className="w-3 h-3 text-indigo-400 shrink-0" />
        <span className="text-[#e2e5ed] font-medium truncate">{data.label}</span>
      </div>
      {data.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {data.tags.slice(0, 2).map((t: string) => (
            <span key={t} className="text-[9px] bg-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded">#{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectGraphNode({ data, selected }: { data: { label: string }; selected: boolean }) {
  return (
    <div className={cn(
      "bg-[#161920] border-2 border-dashed rounded-xl px-3 py-2 text-xs shadow-lg",
      selected ? "border-cyan-500" : "border-[#2a2f40]"
    )}>
      <div className="flex items-center gap-1.5">
        <Folder className="w-3 h-3 text-cyan-400 shrink-0" />
        <span className="text-[#e2e5ed] font-medium truncate">{data.label}</span>
      </div>
    </div>
  );
}

const graphNodeTypes = {
  note: NoteGraphNode as never,
  project: ProjectGraphNode as never,
};

// ─── Graph view ───────────────────────────────────────────────────────────────

function GraphView({ onSelectNote }: { onSelectNote: (id: string) => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notes/graph")
      .then((r) => r.json())
      .then(({ nodes: rawNodes, edges: rawEdges }) => {
        const positioned = (rawNodes as Node[]).map((n, i) => ({
          ...n,
          position: { x: (i % 5) * 220 + 60, y: Math.floor(i / 5) * 140 + 60 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        }));
        setNodes(positioned);
        setEdges((rawEdges as Edge[]).map((e) => ({ ...e, style: { stroke: "#3a3f50" }, animated: false })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setNodes, setEdges]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#5a5f6e] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={graphNodeTypes}
        onNodeClick={(_, node) => {
          if (!node.id.startsWith("project-")) onSelectNote(node.id);
        }}
        fitView
        style={{ background: "#0f1013" }}
      >
        <Background color="#1e2130" gap={20} size={1} />
        <Controls />
        <MiniMap nodeColor={(n) => n.type === "project" ? "#06b6d4" : "#6366f1"} />
      </ReactFlow>
    </div>
  );
}

// ─── Left panel helpers ───────────────────────────────────────────────────────

function NoteRow({ note, active, onSelect, indent }: { note: NoteStub; active: boolean; onSelect: () => void; indent?: boolean }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
        indent && "pl-7",
        active ? "bg-indigo-500/15 text-indigo-400" : "text-[#7a8099] hover:bg-white/5 hover:text-[#c8cdd8]"
      )}
    >
      <FileText className="w-3 h-3 shrink-0 opacity-60" />
      <span className="text-xs truncate flex-1">{note.title}</span>
    </button>
  );
}

// ─── Left panel ───────────────────────────────────────────────────────────────

function LeftPanel({
  notes, projects, search, setSearch,
  activeNoteId, onSelect, onCreate, onCreateDaily,
}: {
  notes: NoteStub[];
  projects: ProjectStub[];
  search: string;
  setSearch: (s: string) => void;
  activeNoteId: string | null;
  onSelect: (id: string) => void;
  onCreate: (projectId?: string) => void;
  onCreateDaily: () => void;
}) {
  const [showProjects, setShowProjects] = useState(true);
  const [showAllNotes, setShowAllNotes] = useState(true);

  const filtered = notes.filter((n) =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const today = format(new Date(), "yyyy-MM-dd");
  const todayNote = notes.find((n) => n.title.includes(today));

  return (
    <div className="w-56 flex flex-col h-full bg-[--sidebar] border-r border-[#181b22] overflow-hidden shrink-0">
      {/* Search */}
      <div className="px-2 py-2 border-b border-[#181b22]">
        <div className="flex items-center gap-2 bg-[#161920] border border-[#1e2130] rounded-lg px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-[#5a5f6e] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="flex-1 bg-transparent text-xs text-[#c8cdd8] placeholder:text-[#3a3f50] outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-[#5a5f6e] hover:text-[#c8cdd8]">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Daily note */}
        <button
          onClick={onCreateDaily}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#7a8099] hover:text-[#c8cdd8] hover:bg-white/5 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{todayNote ? "Today's Note" : "New Daily Note"}</span>
          {todayNote && <span className="text-[9px] text-emerald-400 ml-auto">✓</span>}
        </button>

        {/* Projects */}
        <div className="mt-1">
          <button
            onClick={() => setShowProjects((v) => !v)}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest text-[#3a3f50] hover:text-[#7a8099] transition-colors font-medium"
          >
            {showProjects ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Projects
          </button>
          {showProjects && projects.map((p) => {
            const pNotes = filtered.filter((n) => n.projectId === p.id);
            return (
              <div key={p.id}>
                <div className="flex items-center gap-1.5 px-3 py-1.5 group">
                  <Folder className="w-3 h-3 text-cyan-500 shrink-0" />
                  <span className="text-xs text-[#7a8099] truncate flex-1">{p.name}</span>
                  <button onClick={() => onCreate(p.id)} className="opacity-0 group-hover:opacity-100 text-[#3a3f50] hover:text-indigo-400 transition-all">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {pNotes.map((n) => (
                  <NoteRow key={n.id} note={n} active={activeNoteId === n.id} onSelect={() => onSelect(n.id)} indent />
                ))}
              </div>
            );
          })}
        </div>

        {/* All notes */}
        <div className="mt-2">
          <button
            onClick={() => setShowAllNotes((v) => !v)}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest text-[#3a3f50] hover:text-[#7a8099] transition-colors font-medium"
          >
            {showAllNotes ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            All Notes ({filtered.length})
          </button>
          {showAllNotes && filtered.map((n) => (
            <NoteRow key={n.id} note={n} active={activeNoteId === n.id} onSelect={() => onSelect(n.id)} />
          ))}
        </div>
      </div>

      {/* New note */}
      <div className="border-t border-[#181b22] p-2">
        <button
          onClick={() => onCreate()}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-[#5a5f6e] hover:bg-white/5 hover:text-[#c8cdd8] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New note
        </button>
      </div>
    </div>
  );
}

// ─── Right panel ──────────────────────────────────────────────────────────────

function RightPanel({ note, notes, onNavigate }: { note: Note | null; notes: NoteStub[]; onNavigate: (id: string) => void }) {
  if (!note) {
    return (
      <div className="w-56 border-l border-[#181b22] bg-[--sidebar] flex items-center justify-center shrink-0">
        <div className="text-xs text-[#3a3f50] text-center px-4">Select a note to see details</div>
      </div>
    );
  }

  const backlinkNotes = notes.filter((n) => note.backlinks.includes(n.id));
  const outgoingLinks = [...note.content.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1]);
  const outgoingNotes = outgoingLinks
    .map((title) => notes.find((n) => n.title.toLowerCase() === title.toLowerCase()))
    .filter((n): n is NoteStub => n !== undefined);

  return (
    <div className="w-56 flex flex-col h-full bg-[--sidebar] border-l border-[#181b22] overflow-hidden shrink-0">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Backlinks */}
        <div>
          <div className="text-[9px] uppercase tracking-widest text-[#3a3f50] font-medium mb-2">
            ← Backlinks ({backlinkNotes.length})
          </div>
          {backlinkNotes.length === 0 ? (
            <div className="text-[10px] text-[#3a3f50]">No notes link here</div>
          ) : backlinkNotes.map((n) => (
            <button key={n.id} onClick={() => onNavigate(n.id)}
              className="w-full text-left flex items-center gap-1.5 py-1 text-xs text-[#7a8099] hover:text-indigo-400 transition-colors">
              <FileText className="w-3 h-3 shrink-0" />
              <span className="truncate">{n.title}</span>
            </button>
          ))}
        </div>

        {/* Outgoing links */}
        {outgoingNotes.length > 0 && (
          <div>
            <div className="text-[9px] uppercase tracking-widest text-[#3a3f50] font-medium mb-2">
              → Links To ({outgoingNotes.length})
            </div>
            {outgoingNotes.map((n) => (
              <button key={n.id} onClick={() => onNavigate(n.id)}
                className="w-full text-left flex items-center gap-1.5 py-1 text-xs text-[#7a8099] hover:text-indigo-400 transition-colors">
                <FileText className="w-3 h-3 shrink-0" />
                <span className="truncate">{n.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Tags */}
        {note.tags.length > 0 && (
          <div>
            <div className="text-[9px] uppercase tracking-widest text-[#3a3f50] font-medium mb-2">Tags</div>
            <div className="flex flex-wrap gap-1">
              {note.tags.map((t) => (
                <span key={t} className="text-[10px] bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full">#{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Meta */}
        <div>
          <div className="text-[9px] uppercase tracking-widest text-[#3a3f50] font-medium mb-2">Info</div>
          <div className="space-y-1 text-[10px] text-[#3a3f50]">
            <div>Created {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</div>
            <div>Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</div>
            <div>{note.content.split(/\s+/).filter(Boolean).length} words</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main KnowledgePage ───────────────────────────────────────────────────────

export function KnowledgePage() {
  const [notes, setNotes] = useState<NoteStub[]>([]);
  const [projects, setProjects] = useState<ProjectStub[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"write" | "preview" | "graph">("write");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load notes and projects
  useEffect(() => {
    Promise.all([
      fetch("/api/notes").then((r) => r.json()).catch(() => []),
      fetch("/api/projects").then((r) => r.json()).catch(() => []),
    ]).then(([n, p]) => {
      setNotes(n as NoteStub[]);
      setProjects(p as ProjectStub[]);
    });
  }, []);

  async function loadNote(id: string) {
    const res = await fetch(`/api/notes/${id}`);
    const note = await res.json() as Note;
    setActiveNote(note);
    setDirty(false);
  }

  async function createNote(projectId?: string) {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", content: "# Untitled\n\n", projectId: projectId ?? null }),
    });
    const note = await res.json() as Note;
    setNotes((prev) => [note, ...prev]);
    setActiveNote(note);
    setDirty(false);
  }

  async function createDailyNote() {
    const today = format(new Date(), "yyyy-MM-dd");
    const title = `Daily Note — ${format(new Date(), "MMMM d, yyyy")}`;
    const existing = notes.find((n) => n.title.includes(today) || n.title === title);
    if (existing) { loadNote(existing.id); return; }
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content: `# ${title}\n\n## Today\n\n- \n\n## Notes\n\n`,
        tags: ["daily"],
      }),
    });
    const note = await res.json() as Note;
    setNotes((prev) => [note, ...prev]);
    setActiveNote(note);
    setDirty(false);
  }

  async function saveNote() {
    if (!activeNote) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${activeNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeNote.title,
          content: activeNote.content,
          tags: activeNote.tags,
          projectId: activeNote.projectId,
        }),
      });
      const updated = await res.json() as Note;
      setNotes((prev) => prev.map((n) => n.id === updated.id ? { ...n, ...updated } : n));
      setActiveNote(updated);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function handleContentChange(content: string) {
    setActiveNote((n) => n ? { ...n, content } : n);
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote(), 1500);
  }

  function handleTitleChange(title: string) {
    setActiveNote((n) => n ? { ...n, title } : n);
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote(), 1500);
  }

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase().replace(/^#/, "");
    if (!t || activeNote?.tags.includes(t)) return;
    setActiveNote((n) => n ? { ...n, tags: [...n.tags, t] } : n);
    setDirty(true);
  }

  function removeTag(tag: string) {
    setActiveNote((n) => n ? { ...n, tags: n.tags.filter((t) => t !== tag) } : n);
    setDirty(true);
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
  }

  // Stable wiki link renderer — recreated only when notes list changes
  const WikiLink = useMemo(() => {
    return function WikiLinkComponent({ children }: { children?: React.ReactNode }) {
      const text = String(children ?? "");
      const match = text.match(/^\[\[(.+)\]\]$/);
      if (!match) return <span>{children}</span>;
      const target = match[1];
      const exists = notes.some((n) => n.title.toLowerCase() === target.toLowerCase());
      return (
        <button
          onClick={() => {
            const found = notes.find((n) => n.title.toLowerCase() === target.toLowerCase());
            if (found) loadNote(found.id);
          }}
          className={cn(
            "underline decoration-dotted font-medium transition-colors",
            exists ? "text-indigo-600 hover:text-indigo-500" : "text-[#aab0c0] hover:text-[#7a8099]"
          )}
        >
          {target}
        </button>
      );
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left panel */}
      <LeftPanel
        notes={notes}
        projects={projects}
        search={search}
        setSearch={setSearch}
        activeNoteId={activeNote?.id ?? null}
        onSelect={loadNote}
        onCreate={createNote}
        onCreateDaily={createDailyNote}
      />

      {/* Center */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#e0e3ea] bg-white shrink-0">
          <div className="flex items-center gap-1">
            {(["write", "preview", "graph"] as const).map((m) => {
              const icons = { write: Edit3, preview: Eye, graph: GitBranch };
              const Icon = icons[m];
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    mode === m ? "bg-indigo-500/15 text-indigo-600" : "text-[#7a8099] hover:bg-[#f5f6f9] hover:text-[#1a1d26]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="capitalize">{m}</span>
                </button>
              );
            })}
          </div>
          {activeNote && mode !== "graph" && (
            <div className="flex items-center gap-2">
              {dirty && <span className="text-[10px] text-[#aab0c0]">Unsaved</span>}
              <button
                onClick={saveNote}
                disabled={saving}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  saved ? "bg-emerald-500/15 text-emerald-600" : "bg-[#f5f6f9] hover:bg-[#eceef5] text-[#7a8099] hover:text-[#1a1d26]"
                )}
              >
                {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? "Saving…" : saved ? "Saved" : "Save"}
              </button>
              <button
                onClick={() => deleteNote(activeNote.id)}
                className="p-1.5 rounded-lg text-[#aab0c0] hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content area */}
        {mode === "graph" ? (
          <GraphView onSelectNote={loadNote} />
        ) : !activeNote ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <BookOpen className="w-12 h-12 text-[#c8cdd8] mx-auto mb-3" />
            <div className="text-sm font-semibold text-[#1a1d26] mb-1">Knowledge Vault</div>
            <div className="text-xs text-[#aab0c0] mb-4">Select a note or create a new one</div>
            <div className="flex gap-2">
              <button onClick={() => createNote()} className="flex items-center gap-2 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 rounded-lg px-3 py-2 text-xs font-medium transition-colors">
                <Plus className="w-3.5 h-3.5" /> New Note
              </button>
              <button onClick={createDailyNote} className="flex items-center gap-2 bg-[#f5f6f9] hover:bg-[#eceef5] text-[#7a8099] hover:text-[#1a1d26] rounded-lg px-3 py-2 text-xs font-medium transition-colors">
                <Calendar className="w-3.5 h-3.5" /> Today&apos;s Note
              </button>
            </div>
          </div>
        ) : mode === "write" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Title + Tags */}
            <div className="px-6 pt-5 pb-2 border-b border-[#e8eaf0]">
              <input
                value={activeNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full text-2xl font-bold text-[#1a1d26] bg-transparent outline-none placeholder:text-[#c8cdd8]"
                placeholder="Note title…"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {activeNote.tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full">
                    #{t}
                    <button onClick={() => removeTag(t)} className="hover:text-red-500 transition-colors"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(tagInput);
                      setTagInput("");
                    }
                  }}
                  placeholder="Add tag…"
                  className="text-[10px] text-[#7a8099] bg-transparent outline-none placeholder:text-[#c8cdd8] w-20"
                />
              </div>
            </div>
            {/* Editor */}
            <textarea
              value={activeNote.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="flex-1 px-6 py-4 text-sm text-[#1a1d26] bg-transparent outline-none resize-none font-mono leading-relaxed placeholder:text-[#c8cdd8]"
              placeholder="Start writing… Use [[Note Title]] to link notes"
              spellCheck={false}
            />
          </div>
        ) : (
          /* Preview mode */
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <h1 className="text-2xl font-bold text-[#1a1d26] mb-2">{activeNote.title}</h1>
            {activeNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {activeNote.tags.map((t) => (
                  <span key={t} className="text-[10px] bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full">#{t}</span>
                ))}
              </div>
            )}
            <div className="space-y-3 text-sm text-[#3a4060] leading-relaxed [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-[#1a1d26] [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-[#1a1d26] [&>h3]:text-lg [&>h3]:font-semibold [&>p]:text-[#3a4060] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>blockquote]:border-l-2 [&>blockquote]:border-indigo-500 [&>blockquote]:pl-3 [&>blockquote]:text-[#7a8099]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ({ children }) => {
                    const text = String(children);
                    if (text.match(/^\[\[.+\]\]$/)) {
                      return <WikiLink>{text}</WikiLink>;
                    }
                    return (
                      <code className="text-indigo-600 bg-indigo-500/10 rounded px-1 text-xs">
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {preprocessWikiLinks(activeNote.content)}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Right panel */}
      <RightPanel note={activeNote} notes={notes} onNavigate={loadNote} />
    </div>
  );
}
