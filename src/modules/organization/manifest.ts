import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "orgchart",
  label: "Organization",
  icon: "Network",
  href: "/orgchart",
  description: "Org graph and agent hierarchy",
  category: "core",
  order: 70,
});
