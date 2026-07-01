import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "vps",
  label: "VPS Control",
  icon: "Server",
  href: "/vps",
  description: "Agent registry, health, logs, and config for VPS-hosted agents",
  category: "core",
  order: 75,
});
