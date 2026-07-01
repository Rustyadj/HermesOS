import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "dashboard",
  label: "Mission Control",
  icon: "LayoutDashboard",
  href: "/dashboard",
  description: "Central command overview and system status",
  category: "core",
  order: 10,
});
