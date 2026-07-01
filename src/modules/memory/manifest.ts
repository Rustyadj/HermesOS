import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "memory",
  label: "Memory",
  icon: "Brain",
  href: "/memory",
  description: "Memory Engine — inspect, search, pin, and manage all AI memories",
  category: "core",
  order: 4,
});
