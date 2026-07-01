import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "agents",
  label: "Agents",
  icon: "Bot",
  href: "/agents",
  description: "Agent registry and configuration",
  category: "core",
  order: 30,
});
