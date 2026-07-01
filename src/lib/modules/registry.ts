export interface ModuleDefinition {
  id: string;
  label: string;
  icon: string;
  href: string;
  description: string;
  category: "core" | "installable";
  order: number;
  pinToBottom?: boolean;
}

class ModuleRegistry {
  private _modules = new Map<string, ModuleDefinition>();

  register(mod: ModuleDefinition) {
    this._modules.set(mod.id, mod);
  }

  getAll(): ModuleDefinition[] {
    return Array.from(this._modules.values()).sort((a, b) => a.order - b.order);
  }

  getNav(): ModuleDefinition[] {
    return this.getAll().filter((m) => !m.pinToBottom);
  }

  getBottom(): ModuleDefinition[] {
    return this.getAll().filter((m) => m.pinToBottom);
  }

  get(id: string): ModuleDefinition | undefined {
    return this._modules.get(id);
  }
}

export const moduleRegistry = new ModuleRegistry();
