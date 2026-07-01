import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "builder",
  label: "Studio",
  icon: "Wand2",
  href: "/builder",
  description: "AI creation environment — build UI components with AI",
  category: "core",
  order: 9,
});
