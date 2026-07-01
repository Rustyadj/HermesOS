import { moduleRegistry } from "@/lib/modules/registry";

moduleRegistry.register({
  id: "security",
  label: "Cybersecurity",
  icon: "Shield",
  href: "/security",
  description: "Cyber Range — Red/Blue/Purple team ops, threat intel, attack chains, MITRE techniques",
  category: "installable",
  order: 110,
});
