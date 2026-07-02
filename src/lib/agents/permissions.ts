/**
 * Server-side permission checks for control-plane actions.
 * Agents returned from requireUser() carry role from DB.
 */
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type ControlPlaneRole = "owner" | "admin" | "member" | "viewer";

export interface AuthorizedUser {
  id: string;
  email: string;
  role: ControlPlaneRole;
}

const OWNER_EMAILS = (process.env.CONTROL_PLANE_OWNERS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function resolveRole(email: string): ControlPlaneRole {
  if (OWNER_EMAILS.includes(email.toLowerCase())) return "owner";
  return "member";
}

export async function getControlPlaneUser(): Promise<AuthorizedUser | null> {
  try {
    const session = await auth();
    if (!session?.user?.email) return null;

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      role: resolveRole(user.email),
    };
  } catch {
    return null;
  }
}

export function canEditConfig(role: ControlPlaneRole): boolean {
  return role === "owner" || role === "admin";
}

export function canRestartAgent(role: ControlPlaneRole): boolean {
  return role === "owner" || role === "admin";
}

export function canViewAgent(_role: ControlPlaneRole): boolean {
  return true;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(action: string) {
  return Response.json({ error: `Forbidden: requires owner or admin to ${action}` }, { status: 403 });
}
