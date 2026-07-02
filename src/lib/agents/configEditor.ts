/**
 * Secure server-side config file editor.
 * All paths are validated against AGENT_CONFIG_DIR.
 * Creates timestamped backups before overwrite.
 * Validates JSON/YAML before saving.
 */
import { readFile, writeFile, readdir, mkdir, stat } from "fs/promises";
import path from "path";

const AGENT_CONFIG_DIR = process.env.AGENT_CONFIG_DIR ?? "/opt/sentinel-os/agents";
const ALLOWED_EXTENSIONS = new Set([".md", ".json", ".yaml", ".yml", ".txt"]);

export interface ConfigFile {
  id: string;
  name: string;
  ext: string;
  relativePath: string;
  size: number;
  modifiedAt: string;
}

export interface ConfigFileContent {
  id: string;
  name: string;
  ext: string;
  content: string;
  missing: boolean;
}

// ─── Path safety ──────────────────────────────────────────────────────────────

function resolvedConfigDir(): string {
  return path.resolve(AGENT_CONFIG_DIR);
}

function safeAgentDir(agentId: string): string | null {
  // Allowlist: agent id must be alphanumeric + dash only
  if (!/^[a-z0-9-]+$/.test(agentId)) return null;
  const resolved = path.resolve(AGENT_CONFIG_DIR, agentId);
  if (!resolved.startsWith(resolvedConfigDir())) return null;
  return resolved;
}

function safeFilePath(agentId: string, fileId: string): string | null {
  const agentDir = safeAgentDir(agentId);
  if (!agentDir) return null;
  // fileId is relative path segments joined by "--" (no slashes allowed)
  if (fileId.includes("/") || fileId.includes("\\") || fileId.includes("..")) return null;
  const fileName = fileId.replace(/--/g, path.sep);
  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return null;
  const resolved = path.resolve(agentDir, fileName);
  if (!resolved.startsWith(agentDir)) return null;
  return resolved;
}

function fileIdFromName(name: string): string {
  return name.replace(/[\\/]/g, "--");
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateContent(ext: string, content: string): string | null {
  if (ext === ".json") {
    try { JSON.parse(content); } catch (e) {
      return `Invalid JSON: ${(e as Error).message}`;
    }
  }
  if (ext === ".yaml" || ext === ".yml") {
    // Basic YAML sanity: no tabs at start of line (common YAML mistake)
    const tabLines = content.split("\n").filter((l) => /^\t/.test(l));
    if (tabLines.length > 0) {
      return "Invalid YAML: tabs used for indentation (use spaces)";
    }
  }
  return null;
}

// ─── Backup ───────────────────────────────────────────────────────────────────

async function createBackup(filePath: string): Promise<string | null> {
  try {
    const existing = await readFile(filePath, "utf-8").catch(() => null);
    if (existing === null) return null;
    const backupDir = path.join(path.dirname(filePath), ".backups");
    await mkdir(backupDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `${path.basename(filePath)}.${ts}.bak`;
    const backupPath = path.join(backupDir, backupName);
    await writeFile(backupPath, existing, "utf-8");
    return backupPath;
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listConfigFiles(agentId: string): Promise<ConfigFile[]> {
  const agentDir = safeAgentDir(agentId);
  if (!agentDir) return [];

  try {
    const entries = await readdir(agentDir, { withFileTypes: true });
    const files: ConfigFile[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (entry.name.startsWith(".")) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) continue;

      const fullPath = path.join(agentDir, entry.name);
      const info = await stat(fullPath).catch(() => null);
      if (!info) continue;

      files.push({
        id: fileIdFromName(entry.name),
        name: entry.name,
        ext,
        relativePath: entry.name,
        size: info.size,
        modifiedAt: info.mtime.toISOString(),
      });
    }

    return files.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export async function readConfigFile(agentId: string, fileId: string): Promise<ConfigFileContent> {
  const filePath = safeFilePath(agentId, fileId);
  const fileName = fileId.replace(/--/g, path.sep);
  const ext = path.extname(fileName).toLowerCase();

  if (!filePath) {
    return { id: fileId, name: fileName, ext, content: "", missing: true };
  }

  try {
    const content = await readFile(filePath, "utf-8");
    return { id: fileId, name: fileName, ext, content, missing: false };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return { id: fileId, name: fileName, ext, content: "", missing: true };
    }
    throw err;
  }
}

export async function writeConfigFile(
  agentId: string,
  fileId: string,
  content: string
): Promise<{ ok: boolean; backupPath?: string | null; error?: string }> {
  const filePath = safeFilePath(agentId, fileId);
  if (!filePath) return { ok: false, error: "Invalid file path" };

  const ext = path.extname(filePath).toLowerCase();
  const validationError = validateContent(ext, content);
  if (validationError) return { ok: false, error: validationError };

  const agentDir = path.dirname(filePath);
  await mkdir(agentDir, { recursive: true });

  const backupPath = await createBackup(filePath);
  await writeFile(filePath, content, "utf-8");

  return { ok: true, backupPath };
}

export async function listBackups(agentId: string, fileId: string): Promise<string[]> {
  const filePath = safeFilePath(agentId, fileId);
  if (!filePath) return [];

  const backupDir = path.join(path.dirname(filePath), ".backups");
  const baseName = path.basename(filePath);

  try {
    const entries = await readdir(backupDir);
    return entries
      .filter((e) => e.startsWith(baseName) && e.endsWith(".bak"))
      .sort()
      .reverse()
      .slice(0, 10);
  } catch {
    return [];
  }
}

export async function rollbackConfigFile(
  agentId: string,
  fileId: string,
  backupName: string
): Promise<{ ok: boolean; error?: string }> {
  const filePath = safeFilePath(agentId, fileId);
  if (!filePath) return { ok: false, error: "Invalid file path" };

  // backupName must not traverse
  if (backupName.includes("/") || backupName.includes("\\") || backupName.includes("..")) {
    return { ok: false, error: "Invalid backup name" };
  }

  const backupDir = path.join(path.dirname(filePath), ".backups");
  const backupPath = path.resolve(backupDir, backupName);
  if (!backupPath.startsWith(path.resolve(backupDir))) {
    return { ok: false, error: "Invalid backup path" };
  }

  try {
    const content = await readFile(backupPath, "utf-8");
    await createBackup(filePath);
    await writeFile(filePath, content, "utf-8");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
