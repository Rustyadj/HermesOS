import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "obsidian",
  label: "Knowledge",
  icon: "BookOpen",
  href: "/obsidian",
  description: "Knowledge base and memory vault",
  category: "core",
  order: 40,
});
