import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "marketing",
  label: "Marketing",
  icon: "BarChart3",
  href: "/marketing",
  description: "Campaigns, CRM, and analytics",
  category: "installable",
  order: 130,
});
