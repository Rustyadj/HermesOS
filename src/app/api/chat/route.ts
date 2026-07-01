import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { exec } from "child_process";
import { promisify } from "util";
import { AGENT_TEMPLATES } from "@/lib/constants";
import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

const execAsync = promisify(exec);
const encoder = new TextEncoder();

function sse(data: object): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function sseStream(
  fn: (ctrl: ReadableStreamDefaultController) => Promise<void>
): Response {
  return new Response(
    new ReadableStream({ start: fn }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
}

function sseError(message: string): Response {
  return sseStream(async (ctrl) => {
    ctrl.enqueue(sse({ type: "error", error: message }));
    ctrl.enqueue(encoder.encode("data: [DONE]\n\n"));
    ctrl.close();
  });
}

function pickProvider(model: string) {
  if (model.startsWith("claude")) return "anthropic";
  if (model.startsWith("gpt") || model === "o1" || model === "o3") return "openai";
  return "openrouter";
}

// ─── Memory injection ─────────────────────────────────────────────────────────

async function buildSystemPrompt(agentId: string, basePrompt: string): Promise<string> {
  try {
    const memories = await db.memory.findMany({
      where: { owner: agentId, archived: false },
      orderBy: [{ pinned: "desc" }, { importanceScore: "desc" }, { createdAt: "desc" }],
      take: 30,
      select: { content: true, type: true, scope: true, tags: true, confidence: true },
    });

    if (memories.length === 0) return basePrompt;

    const memBlock = memories
      .map((m) => {
        const tags = m.tags.length ? ` [${m.tags.join(", ")}]` : "";
        return `• [${m.type}/${m.scope}]${tags} ${m.content}`;
      })
      .join("\n");

    return `${basePrompt}

## Persistent Memory
The following memories have been stored about your work and context. Use them to maintain continuity across conversations:
${memBlock}`;
  } catch {
    return basePrompt;
  }
}

// ─── Bash tool execution ──────────────────────────────────────────────────────

async function executeBash(command: string): Promise<string> {
  if (!command?.trim()) return "[error] Empty command";
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 15000,
      cwd: "/opt/sentinel-os",
      env: { ...process.env, HOME: "/root", PATH: process.env.PATH ?? "/usr/bin:/bin" },
    });
    return ((stdout ?? "") + (stderr ?? "")).trim() || "(no output)";
  } catch (err) {
    return `[error] ${(err as Error).message}`;
  }
}

const BASH_TOOL: Anthropic.Tool = {
  name: "bash",
  description:
    "Execute a bash command on the VPS. Use for file operations, running scripts, checking system state, inspecting logs, managing docker containers, reading config files, and any terminal task. Working directory is /opt/sentinel-os.",
  input_schema: {
    type: "object",
    properties: {
      command: { type: "string", description: "The bash command to run" },
    },
    required: ["command"],
  },
};

function agentTools(toolPermissions: string[]): Anthropic.Tool[] {
  const hasBash =
    toolPermissions.includes("all") ||
    toolPermissions.includes("code_execution") ||
    toolPermissions.includes("file_system") ||
    toolPermissions.includes("system_monitor");
  return hasBash ? [BASH_TOOL] : [];
}

// ─── Anthropic agentic streaming loop ────────────────────────────────────────

async function anthropicAgenticStream(
  ctrl: ReadableStreamDefaultController,
  anthropic: Anthropic,
  params: {
    model: string;
    system: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    tools: Anthropic.Tool[];
  }
): Promise<string> {
  let fullContent = "";
  type MsgParam = Anthropic.MessageParam;
  let currentMessages: MsgParam[] = params.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let turn = 0; turn < 10; turn++) {
    const stream = await anthropic.messages.create({
      model: params.model,
      max_tokens: 4096,
      system: params.system,
      messages: currentMessages,
      tools: params.tools.length > 0 ? params.tools : undefined,
      stream: true,
    });

    let turnText = "";
    let stopReason = "end_turn";
    const toolUses: Array<{ id: string; name: string; inputJson: string }> = [];
    let currentTool: { id: string; name: string; inputJson: string } | null = null;

    for await (const event of stream) {
      if (event.type === "content_block_start") {
        if (event.content_block.type === "tool_use") {
          currentTool = { id: event.content_block.id, name: event.content_block.name, inputJson: "" };
        }
      }
      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          turnText += event.delta.text;
          fullContent += event.delta.text;
          ctrl.enqueue(sse({ type: "text", text: event.delta.text }));
        } else if (event.delta.type === "input_json_delta" && currentTool) {
          currentTool.inputJson += event.delta.partial_json;
        }
      }
      if (event.type === "content_block_stop" && currentTool) {
        toolUses.push(currentTool);
        currentTool = null;
      }
      if (event.type === "message_delta" && event.delta.stop_reason) {
        stopReason = event.delta.stop_reason;
      }
    }

    if (stopReason !== "tool_use" || toolUses.length === 0) break;

    // Build assistant turn with all content blocks (use param types, not response types)
    type AssistantBlock = Anthropic.Messages.TextBlockParam | Anthropic.Messages.ToolUseBlockParam;
    const assistantBlocks: AssistantBlock[] = [];
    if (turnText) assistantBlocks.push({ type: "text", text: turnText });
    for (const t of toolUses) {
      let input: Record<string, unknown> = {};
      try { input = JSON.parse(t.inputJson || "{}") as Record<string, unknown>; } catch { /**/ }
      assistantBlocks.push({ type: "tool_use", id: t.id, name: t.name, input });
    }

    // Execute tools and collect results
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const t of toolUses) {
      let input: Record<string, unknown> = {};
      try { input = JSON.parse(t.inputJson || "{}") as Record<string, unknown>; } catch { /**/ }

      const command = String(input.command ?? "");

      // Emit tool call as visible text in the stream
      const callBlock = `\n\`\`\`bash\n$ ${command}\n\`\`\`\n`;
      ctrl.enqueue(sse({ type: "text", text: callBlock }));
      fullContent += callBlock;

      let output = "[error] Unknown tool";
      if (t.name === "bash") {
        output = await executeBash(command);
      }

      const resultBlock = `\`\`\`\n${output}\n\`\`\`\n`;
      ctrl.enqueue(sse({ type: "text", text: resultBlock }));
      fullContent += resultBlock;

      toolResults.push({ type: "tool_result", tool_use_id: t.id, content: output });
    }

    currentMessages = [
      ...currentMessages,
      { role: "assistant" as const, content: assistantBlocks },
      { role: "user" as const, content: toolResults },
    ];
  }

  return fullContent;
}

// ─── Persist messages ─────────────────────────────────────────────────────────

async function persistMessages(
  roomId: string,
  userContent: string,
  agentId: string,
  assistantContent: string
) {
  try {
    await db.message.createMany({
      data: [
        { chatRoomId: roomId, role: "user", content: userContent },
        { chatRoomId: roomId, role: "agent", agentId, content: assistantContent },
      ],
    });
  } catch (err) {
    console.error("[chat] persist failed:", err);
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    agentId: string;
    roomId?: string;
    userContent?: string;
  };

  try {
    body = await request.json();
  } catch {
    return sseError("Invalid request body");
  }

  const { messages, agentId, roomId, userContent } = body;
  if (!messages?.length || !agentId) {
    return sseError("Missing required fields: messages, agentId");
  }

  const agentTemplate = AGENT_TEMPLATES.find((a) => a.id === agentId);
  const model = agentTemplate?.model ?? "claude-sonnet-4-6";
  const baseSystemPrompt =
    agentTemplate?.systemPrompt ??
    "You are an AI assistant in the Sentinel OS platform. Be concise and professional.";
  const toolPermissions = agentTemplate?.toolPermissions ?? [];

  const provider = pickProvider(model);

  const anthropicKey = request.headers.get("x-anthropic-key") ?? "";
  const openaiKey = request.headers.get("x-openai-key") ?? "";
  const openrouterKey = request.headers.get("x-openrouter-key") ?? "";

  // ── Anthropic ─────────────────────────────────────────────────────────────
  if (provider === "anthropic") {
    if (!anthropicKey) return sseError("Anthropic API key not configured — add it in Settings → API Keys");

    return sseStream(async (ctrl) => {
      let fullContent = "";
      try {
        const anthropic = new Anthropic({ apiKey: anthropicKey });
        const system = await buildSystemPrompt(agentId, baseSystemPrompt);
        const tools = agentTools(toolPermissions);

        fullContent = await anthropicAgenticStream(ctrl, anthropic, {
          model,
          system,
          messages,
          tools,
        });
      } catch (err) {
        ctrl.enqueue(
          sse({ type: "error", error: err instanceof Error ? err.message : "Anthropic API error" })
        );
      } finally {
        ctrl.enqueue(encoder.encode("data: [DONE]\n\n"));
        ctrl.close();
        if (roomId && userContent && fullContent) {
          await persistMessages(roomId, userContent, agentId, fullContent);
        }
      }
    });
  }

  // ── OpenAI ────────────────────────────────────────────────────────────────
  if (provider === "openai") {
    if (!openaiKey) return sseError("OpenAI API key not configured — add it in Settings → API Keys");

    return sseStream(async (ctrl) => {
      let fullContent = "";
      try {
        const openai = new OpenAI({ apiKey: openaiKey });
        const system = await buildSystemPrompt(agentId, baseSystemPrompt);
        const stream = await openai.chat.completions.create({
          model,
          max_tokens: 4096,
          messages: [{ role: "system", content: system }, ...messages],
          stream: true,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            fullContent += text;
            ctrl.enqueue(sse({ type: "text", text }));
          }
          if (chunk.choices[0]?.finish_reason) break;
        }
      } catch (err) {
        ctrl.enqueue(
          sse({ type: "error", error: err instanceof Error ? err.message : "OpenAI API error" })
        );
      } finally {
        ctrl.enqueue(encoder.encode("data: [DONE]\n\n"));
        ctrl.close();
        if (roomId && userContent && fullContent) {
          await persistMessages(roomId, userContent, agentId, fullContent);
        }
      }
    });
  }

  // ── OpenRouter ────────────────────────────────────────────────────────────
  if (!openrouterKey) return sseError("OpenRouter API key not configured — add it in Settings → API Keys");

  return sseStream(async (ctrl) => {
    let fullContent = "";
    try {
      const openai = new OpenAI({
        apiKey: openrouterKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://sentinel-os.ai",
          "X-Title": "Sentinel OS",
        },
      });
      const system = await buildSystemPrompt(agentId, baseSystemPrompt);
      const stream = await openai.chat.completions.create({
        model,
        max_tokens: 4096,
        messages: [{ role: "system", content: system }, ...messages],
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          fullContent += text;
          ctrl.enqueue(sse({ type: "text", text }));
        }
        if (chunk.choices[0]?.finish_reason) break;
      }
    } catch (err) {
      ctrl.enqueue(
        sse({ type: "error", error: err instanceof Error ? err.message : "OpenRouter API error" })
      );
    } finally {
      ctrl.enqueue(encoder.encode("data: [DONE]\n\n"));
      ctrl.close();
      if (roomId && userContent && fullContent) {
        await persistMessages(roomId, userContent, agentId, fullContent);
      }
    }
  });
}
