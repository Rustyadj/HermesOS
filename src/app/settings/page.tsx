"use client";

import { useState } from "react";
import { Settings, User, Bot, Brain, Palette, Shield, Bell, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "agents", label: "Agent Defaults", icon: Bot },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "api", label: "API Keys", icon: Key },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");

  return (
    <div className="flex h-full">
      {/* Settings nav */}
      <div className="w-48 border-r border-[--border] bg-[--sidebar] p-3 shrink-0">
        <div className="text-[10px] uppercase tracking-widest text-[--muted-foreground] mb-3 px-2">Settings</div>
        <div className="space-y-0.5">
          {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
                activeSection === id
                  ? "bg-[--primary]/15 text-[--primary]"
                  : "text-[--muted-foreground] hover:text-[--foreground] hover:bg-[--accent]"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-xl">
          {activeSection === "profile" && <ProfileSettings />}
          {activeSection === "agents" && <AgentSettings />}
          {activeSection === "memory" && <MemorySettings />}
          {activeSection === "appearance" && <AppearanceSettings />}
          {activeSection === "security" && <SecuritySettings />}
          {activeSection === "api" && <APIKeySettings />}
          {activeSection === "notifications" && <NotificationSettings />}
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-xs text-[--muted-foreground]">{description}</p>}
      </CardHeader>
      <CardContent className="pt-0 space-y-4">{children}</CardContent>
    </Card>
  );
}

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm text-[--foreground]">{label}</div>
        {description && <div className="text-xs text-[--muted-foreground]">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={cn("w-10 h-5 rounded-full transition-colors relative", on ? "bg-[--primary]" : "bg-[--muted]")}
    >
      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", on ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}

function ProfileSettings() {
  return (
    <>
      <SettingsSection title="Profile" description="Your personal information">
        <FieldRow label="Name">
          <Input defaultValue="Rusty Adj" className="w-48 h-8 text-sm" />
        </FieldRow>
        <FieldRow label="Email">
          <Input defaultValue="rustyadj@gmail.com" className="w-48 h-8 text-sm" />
        </FieldRow>
        <FieldRow label="Role">
          <Input defaultValue="System Administrator" className="w-48 h-8 text-sm" />
        </FieldRow>
      </SettingsSection>
      <Button size="sm">Save Changes</Button>
    </>
  );
}

function AgentSettings() {
  return (
    <SettingsSection title="Agent Defaults" description="Default settings for new agents">
      <FieldRow label="Default model" description="Used when creating new agents">
        <select className="h-8 px-2 rounded border border-[--border] bg-[--muted] text-sm text-[--foreground]">
          <option>claude-sonnet-4-6</option>
          <option>claude-opus-4-8</option>
          <option>gpt-4o</option>
        </select>
      </FieldRow>
      <FieldRow label="Default memory scope">
        <select className="h-8 px-2 rounded border border-[--border] bg-[--muted] text-sm text-[--foreground]">
          <option>project</option>
          <option>session</option>
          <option>org</option>
        </select>
      </FieldRow>
      <FieldRow label="Supervisor agent" description="Hermes Lisa orchestrates by default">
        <Toggle defaultOn={true} />
      </FieldRow>
      <FieldRow label="Human approval gates" description="Require approval before destructive actions">
        <Toggle defaultOn={true} />
      </FieldRow>
    </SettingsSection>
  );
}

function MemorySettings() {
  return (
    <SettingsSection title="Memory System" description="Control what gets stored and for how long">
      <FieldRow label="Auto-save decisions" description="Save agent decision reasoning">
        <Toggle defaultOn={true} />
      </FieldRow>
      <FieldRow label="Compress old conversations">
        <Toggle defaultOn={true} />
      </FieldRow>
      <FieldRow label="Quality threshold" description="Minimum importance score (0-10)">
        <Input defaultValue="5.0" type="number" className="w-20 h-8 text-sm" />
      </FieldRow>
      <FieldRow label="Max memories per scope">
        <Input defaultValue="500" type="number" className="w-20 h-8 text-sm" />
      </FieldRow>
    </SettingsSection>
  );
}

function AppearanceSettings() {
  const themes = ["Dark (default)", "Darker", "Nord", "Custom"];
  return (
    <SettingsSection title="Appearance" description="Customize the look and feel">
      <FieldRow label="Theme">
        <select className="h-8 px-2 rounded border border-[--border] bg-[--muted] text-sm text-[--foreground]">
          {themes.map((t) => <option key={t}>{t}</option>)}
        </select>
      </FieldRow>
      <FieldRow label="Sidebar collapsed by default">
        <Toggle />
      </FieldRow>
      <FieldRow label="Right panel open by default">
        <Toggle defaultOn={true} />
      </FieldRow>
      <FieldRow label="Compact mode">
        <Toggle />
      </FieldRow>
    </SettingsSection>
  );
}

function SecuritySettings() {
  return (
    <SettingsSection title="Security" description="Access control and audit settings">
      <FieldRow label="Audit logging" description="Log all agent actions">
        <Toggle defaultOn={true} />
      </FieldRow>
      <FieldRow label="Tool permission enforcement" description="Block unauthorized tool calls">
        <Toggle defaultOn={true} />
      </FieldRow>
      <FieldRow label="Require approval for >$10 tool calls">
        <Toggle defaultOn={true} />
      </FieldRow>
    </SettingsSection>
  );
}

function APIKeySettings() {
  const keys = [
    { name: "Anthropic", key: "sk-ant-...4f2a", status: "active" },
    { name: "OpenAI", key: "sk-proj-...8c1d", status: "active" },
    { name: "Brave Search", key: "BSA-...9f34", status: "active" },
  ];
  return (
    <SettingsSection title="API Keys" description="Manage provider credentials">
      <div className="space-y-2">
        {keys.map((k) => (
          <div key={k.name} className="flex items-center gap-3 py-2 border-b border-[--border] last:border-0">
            <div className="flex-1">
              <div className="text-sm text-[--foreground]">{k.name}</div>
              <div className="text-xs font-mono text-[--muted-foreground]">{k.key}</div>
            </div>
            <Badge variant="success" className="text-[10px]">{k.status}</Badge>
            <Button size="sm" variant="outline" className="h-7 text-xs">Rotate</Button>
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" className="gap-1.5 mt-2">
        <Key className="w-3.5 h-3.5" />
        Add Key
      </Button>
    </SettingsSection>
  );
}

function NotificationSettings() {
  return (
    <SettingsSection title="Notifications" description="Control when you get notified">
      {[
        ["Agent task completed", true],
        ["Agent requires approval", true],
        ["Security finding detected", true],
        ["Memory limit approaching", false],
        ["Workflow execution failed", true],
      ].map(([label, on]) => (
        <FieldRow key={label as string} label={label as string}>
          <Toggle defaultOn={on as boolean} />
        </FieldRow>
      ))}
    </SettingsSection>
  );
}
