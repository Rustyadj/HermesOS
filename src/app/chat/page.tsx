"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Plus,
  Bot,
  Users,
  ChevronDown,
  Wrench,
  ChevronRight,
  AtSign,
  Cpu,
  Loader2,
} from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useAgentStore } from "@/store/useAgentStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Message } from "@/types";

export default function ChatPage() {
  const { rooms, activeRoomId, setActiveRoom, addMessage, createRoom } = useChatStore();
  const { agents } = useAgentStore();
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeRoom = rooms.find((r) => r.id === activeRoomId);
  const roomAgents = agents.filter((a) => activeRoom?.agents.includes(a.id));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeRoom?.messages]);

  const handleSend = () => {
    if (!input.trim() || !activeRoomId) return;

    addMessage(activeRoomId, {
      id: `msg-${Date.now()}`,
      chatId: activeRoomId,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    });

    const userInput = input.trim();
    setInput("");
    setIsThinking(true);

    // Simulate agent response
    setTimeout(() => {
      const respondingAgent = roomAgents[0];
      if (!respondingAgent) { setIsThinking(false); return; }

      addMessage(activeRoomId, {
        id: `msg-${Date.now() + 1}`,
        chatId: activeRoomId,
        role: "agent",
        agentId: respondingAgent.id,
        agentName: respondingAgent.name,
        agentColor: respondingAgent.color,
        agentAvatar: respondingAgent.avatar,
        content: getSimulatedResponse(respondingAgent.name, userInput),
        timestamp: new Date(),
      });
      setIsThinking(false);
    }, 1200 + Math.random() * 800);
  };

  return (
    <div className="flex h-full">
      {/* Room sidebar */}
      <div className="w-56 border-r border-[--border] flex flex-col bg-[--sidebar] shrink-0">
        <div className="p-3 border-b border-[--border] flex items-center justify-between">
          <span className="text-xs font-medium text-[--foreground]">Rooms</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => {
              const name = `Room ${rooms.length + 1}`;
              createRoom(name, ["hermes-lisa"]);
            }}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {rooms.map((room) => {
              const roomAgentList = agents.filter((a) => room.agents.includes(a.id));
              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={cn(
                    "w-full text-left px-2.5 py-2.5 rounded-md transition-colors",
                    room.id === activeRoomId
                      ? "bg-[--primary]/15 text-[--primary]"
                      : "hover:bg-[--accent] text-[--muted-foreground] hover:text-[--foreground]"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-3 h-3 shrink-0" />
                    <span className="text-xs font-medium truncate">{room.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {roomAgentList.slice(0, 3).map((a) => (
                      <span key={a.id} className="text-[11px]" title={a.name}>
                        {a.avatar}
                      </span>
                    ))}
                    {room.messages.length > 0 && (
                      <span className="text-[10px] text-[--muted-foreground] ml-auto">
                        {room.messages.length} msgs
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {activeRoom ? (
          <>
            {/* Room header */}
            <div className="h-14 border-b border-[--border] px-4 flex items-center gap-3 bg-[--card] shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[--foreground]">{activeRoom.name}</span>
                <div className="flex items-center gap-1">
                  {roomAgents.map((a) => (
                    <div
                      key={a.id}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs border border-[--border]"
                      style={{ backgroundColor: a.color + "22" }}
                      title={a.name}
                    >
                      {a.avatar}
                    </div>
                  ))}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {roomAgents.length} agents
                </Badge>
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                  <Bot className="w-3 h-3" />
                  Add Agent
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {activeRoom.messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[--primary]/10 flex items-center justify-center mb-4">
                      <Cpu className="w-6 h-6 text-[--primary]" />
                    </div>
                    <div className="text-sm font-medium text-[--foreground] mb-1">
                      {activeRoom.name}
                    </div>
                    <div className="text-xs text-[--muted-foreground] max-w-xs">
                      {roomAgents.map((a) => a.name).join(", ")} {roomAgents.length === 1 ? "is" : "are"} ready. Start a conversation or type @agent to mention someone specifically.
                    </div>
                  </div>
                )}
                {activeRoom.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isThinking && (
                  <ThinkingIndicator agent={roomAgents[0]} />
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-[--border] p-4 bg-[--card] shrink-0">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={`Message ${activeRoom.name}… (@ to mention an agent)`}
                      className="pr-10 bg-[--muted] border-[--border] text-sm"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[--muted-foreground] hover:text-[--foreground]">
                      <AtSign className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isThinking}
                    size="icon"
                    className="shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 mt-2 px-1">
                  {roomAgents.map((a) => (
                    <button
                      key={a.id}
                      className="flex items-center gap-1 text-[10px] text-[--muted-foreground] hover:text-[--foreground] transition-colors"
                    >
                      <span>{a.avatar}</span>
                      <span>{a.name}</span>
                    </button>
                  ))}
                  <span className="ml-auto text-[10px] text-[--muted-foreground]">
                    Enter to send · Shift+Enter for newline
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="w-10 h-10 text-[--muted-foreground] mx-auto mb-3" />
              <div className="text-sm text-[--muted-foreground]">Select a room to start</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("flex gap-3 animate-fade-in", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-7 h-7 rounded-full bg-[--primary]/20 flex items-center justify-center text-xs text-[--primary] font-medium">
            R
          </div>
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
            style={{ backgroundColor: (message.agentColor ?? "#666") + "22" }}
          >
            {message.agentAvatar ?? "🤖"}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isUser && "flex flex-col items-end")}>
        {/* Header */}
        <div className={cn("flex items-center gap-2 mb-1", isUser && "flex-row-reverse")}>
          <span className="text-xs font-medium text-[--foreground]">
            {isUser ? "You" : message.agentName ?? "Agent"}
          </span>
          <span className="text-[10px] text-[--muted-foreground]">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
        </div>

        {/* Reasoning */}
        {message.reasoning && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] text-[--muted-foreground] mb-1.5 hover:text-[--foreground] transition-colors"
          >
            <ChevronRight className={cn("w-3 h-3 transition-transform", expanded && "rotate-90")} />
            View reasoning
          </button>
        )}
        {message.reasoning && expanded && (
          <div className="mb-2 px-3 py-2 rounded-md border border-[--border] bg-[--muted] text-[11px] text-[--muted-foreground] italic">
            {message.reasoning}
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "px-3.5 py-2.5 rounded-xl text-sm leading-relaxed max-w-[80%]",
            isUser
              ? "bg-[--primary] text-white"
              : "bg-[--card] border border-[--border] text-[--foreground]"
          )}
        >
          {message.content}
        </div>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tc) => (
              <div
                key={tc.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[--muted] border border-[--border] text-[11px]"
              >
                <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-amber-400 font-mono">{tc.name}</span>
                <Badge
                  variant={tc.status === "complete" ? "success" : tc.status === "error" ? "destructive" : "secondary"}
                  className="text-[9px] ml-auto"
                >
                  {tc.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator({ agent }: { agent?: import("@/types").Agent }) {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
        style={{ backgroundColor: (agent?.color ?? "#666") + "22" }}
      >
        {agent?.avatar ?? "🤖"}
      </div>
      <div className="bg-[--card] border border-[--border] rounded-xl px-4 py-3 flex items-center gap-2">
        <Loader2 className="w-3.5 h-3.5 text-[--muted-foreground] animate-spin" />
        <span className="text-xs text-[--muted-foreground]">
          {agent?.name ?? "Agent"} is thinking…
        </span>
      </div>
    </div>
  );
}

function getSimulatedResponse(agentName: string, input: string): string {
  const responses: Record<string, string[]> = {
    "Hermes Lisa": [
      `I've analyzed your request: "${input.slice(0, 50)}${input.length > 50 ? "…" : ""}". Let me coordinate with the team to provide the best response. I'll synthesize the outputs and get back to you shortly.`,
      `Understood. I'm routing this task to the appropriate specialist agents. Expect a comprehensive response with full context preservation.`,
    ],
    "Claude Code": [
      `Looking at this from an engineering perspective — here's my initial assessment: we should start with the data layer, then build up the API contracts, and finally wire the UI components. Want me to draft the schema?`,
      `I can help with that. Let me think through the architecture... I'd recommend a clean separation of concerns here, with typed interfaces at each boundary.`,
    ],
  };

  const agentResponses = responses[agentName] ?? [
    `I've received your message and I'm processing it. Here's what I found relevant to your query about "${input.slice(0, 30)}${input.length > 30 ? "…" : ""}". I'll provide a detailed analysis in a moment.`,
  ];

  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}
