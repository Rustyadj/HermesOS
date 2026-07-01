export { moduleRegistry } from "./registry";
export type { ModuleDefinition } from "./registry";
// Import all modules to trigger self-registration
import "@/modules";
