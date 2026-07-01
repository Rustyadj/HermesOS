import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "workflows",
  label: "Workflows",
  icon: "GitBranch",
  href: "/workflows",
  description: "Automated multi-step AI pipelines",
  category: "core",
  order: 50,
});
