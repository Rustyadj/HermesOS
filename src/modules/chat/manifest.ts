import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "chat",
  label: "Chat",
  icon: "MessageSquare",
  href: "/chat",
  description: "Multi-agent conversation workspace",
  category: "core",
  order: 20,
});
