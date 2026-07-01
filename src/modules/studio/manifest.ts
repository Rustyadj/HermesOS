import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "builder",
  label: "AI Studio",
  icon: "Sparkles",
  href: "/builder",
  description: "Build engine — websites, apps, modules, agents, APIs",
  category: "core",
  order: 9,
});
