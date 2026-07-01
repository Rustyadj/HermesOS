import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "kanban",
  label: "Kanban",
  icon: "Kanban",
  href: "/kanban",
  description: "Task and project management",
  category: "core",
  order: 60,
});
