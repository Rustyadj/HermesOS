import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "settings",
  label: "Settings",
  icon: "Settings",
  href: "/settings",
  description: "System configuration",
  category: "core",
  order: 999,
  pinToBottom: true,
});
