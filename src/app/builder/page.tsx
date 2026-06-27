"use client";

import { useState } from "react";
import { Wand2, Play, Code2, Eye, Save, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "Build a pricing table with 3 tiers",
  "Create a user profile card",
  "Design a data dashboard with charts",
  "Make a login form with validation",
];

const SAMPLE_GENERATED = `import { useState } from "react";

export function PricingTable() {
  const [billing, setBilling] = useState("monthly");

  const tiers = [
    { name: "Starter", price: { monthly: 29, annual: 23 }, features: ["5 agents", "10GB memory", "API access"] },
    { name: "Pro", price: { monthly: 79, annual: 63 }, features: ["25 agents", "100GB memory", "Priority support", "Custom models"] },
    { name: "Enterprise", price: { monthly: 299, annual: 239 }, features: ["Unlimited agents", "1TB memory", "Dedicated support", "SLA guarantee"] },
  ];

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h2 className="text-3xl font-bold text-center mb-8">Simple pricing</h2>
      <div className="grid grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div key={tier.name} className="rounded-xl border p-6">
            <h3 className="font-semibold text-lg">{tier.name}</h3>
            <div className="text-4xl font-bold my-4">
              \${tier.price[billing]}<span className="text-sm font-normal">/mo</span>
            </div>
            <ul className="space-y-2">
              {tier.features.map((f) => (
                <li key={f} className="text-sm">✓ {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}`;

export default function BuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setGenerated(SAMPLE_GENERATED);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[--border] bg-[--card] px-6 h-14 flex items-center gap-3 shrink-0">
        <Wand2 className="w-4 h-4 text-[--primary]" />
        <span className="font-medium text-sm text-[--foreground]">AI Builder</span>
        {generated && (
          <>
            <Badge variant="success" className="text-[10px]">Generated</Badge>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Save className="w-3 h-3" />
                Save
              </Button>
              <Button size="sm" className="h-7 text-xs gap-1">
                <Play className="w-3 h-3" />
                Deploy
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: Prompt area */}
        <div className="w-80 border-r border-[--border] flex flex-col bg-[--sidebar] shrink-0">
          <div className="p-4 flex-1 overflow-auto">
            <div className="mb-4">
              <label className="text-xs font-medium text-[--foreground] mb-2 block">Describe what to build</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Build a pricing table with 3 tiers — Starter, Pro, Enterprise..."
                className="w-full h-32 resize-none rounded-lg border border-[--border] bg-[--muted] text-sm text-[--foreground] placeholder:text-[--muted-foreground] p-3 focus:outline-none focus:ring-1 focus:ring-[--ring]"
              />
            </div>

            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-widest text-[--muted-foreground] mb-2">Quick examples</div>
              <div className="space-y-1">
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPrompt(p)}
                    className="w-full text-left px-2.5 py-2 rounded text-xs text-[--muted-foreground] hover:text-[--foreground] hover:bg-[--accent] transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-widest text-[--muted-foreground] mb-2">Agents</div>
              <div className="space-y-1.5">
                {["💻 Claude Code · Build", "🌸 Hermes Lisa · Orchestrate", "🔍 OpenClaw · Research"].map((a) => (
                  <div key={a} className="flex items-center gap-2 text-xs text-[--muted-foreground]">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {a}
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full gap-2"
              size="sm"
            >
              <Wand2 className={cn("w-4 h-4", isGenerating && "animate-spin")} />
              {isGenerating ? "Generating…" : "Generate"}
            </Button>
          </div>

          {/* Saved components */}
          <div className="border-t border-[--border] p-3">
            <div className="text-[10px] uppercase tracking-widest text-[--muted-foreground] mb-2">Saved Components</div>
            <div className="space-y-1">
              {["PricingTable", "UserCard", "StatsGrid"].map((comp) => (
                <button key={comp} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[--muted-foreground] hover:text-[--foreground] hover:bg-[--accent] transition-colors">
                  <Layers className="w-3 h-3" />
                  {comp}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview / Code */}
        <div className="flex-1 flex flex-col min-w-0">
          {generated ? (
            <>
              <div className="border-b border-[--border] px-4 h-10 flex items-center gap-1 bg-[--card] shrink-0">
                {(["preview", "code"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors capitalize",
                      activeTab === tab
                        ? "bg-[--accent] text-[--foreground]"
                        : "text-[--muted-foreground] hover:text-[--foreground]"
                    )}
                  >
                    {tab === "preview" ? <Eye className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "preview" ? (
                <div className="flex-1 bg-white flex items-center justify-center p-8 overflow-auto">
                  <div className="max-w-3xl w-full">
                    {/* Mock pricing table preview */}
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Simple pricing</h2>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { name: "Starter", price: "$29", color: "#6366f1", features: ["5 agents", "10GB memory", "API access"] },
                        { name: "Pro", price: "$79", color: "#8B5CF6", features: ["25 agents", "100GB memory", "Priority support"], highlight: true },
                        { name: "Enterprise", price: "$299", color: "#3B82F6", features: ["Unlimited agents", "1TB memory", "Dedicated support"] },
                      ].map((tier) => (
                        <div
                          key={tier.name}
                          className={cn(
                            "rounded-xl border p-5 text-gray-900",
                            tier.highlight ? "border-2 shadow-lg" : "border-gray-200"
                          )}
                          style={{ borderColor: tier.highlight ? tier.color : undefined }}
                        >
                          <div className="text-sm font-semibold mb-3" style={{ color: tier.color }}>{tier.name}</div>
                          <div className="text-3xl font-bold mb-1">{tier.price}<span className="text-sm font-normal text-gray-500">/mo</span></div>
                          <div className="text-xs text-gray-500 mb-4">billed monthly</div>
                          <ul className="space-y-2">
                            {tier.features.map((f) => (
                              <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                                <span className="text-emerald-500">✓</span> {f}
                              </li>
                            ))}
                          </ul>
                          <button
                            className="mt-4 w-full py-2 rounded-lg text-xs font-medium text-white"
                            style={{ backgroundColor: tier.color }}
                          >
                            Get started
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto bg-[--muted] p-4">
                  <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
                    {generated}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-[--primary]/10 flex items-center justify-center mb-4">
                <Wand2 className="w-8 h-8 text-[--primary]" />
              </div>
              <div className="text-sm font-medium text-[--foreground] mb-2">AI Builder</div>
              <div className="text-xs text-[--muted-foreground] max-w-sm">
                Describe a component, page, or app and the AI will generate React code with a live preview. Your agents collaborate to design, code, and review.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
