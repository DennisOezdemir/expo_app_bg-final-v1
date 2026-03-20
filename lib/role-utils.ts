import type { UserRole } from "@/contexts/RoleContext";

/**
 * Filter projects based on user role and assignment.
 *
 * - GF: sees all projects
 * - BL: sees only projects where they are assigned as bauleiter (project.bauleiter_id === userId)
 * - Monteur: sees only projects where they are assigned via schedule_phases / team_assignments
 *
 * @param projects Array of project rows (must have at minimum { id, bauleiter_id? })
 * @param role Current user role
 * @param userId Current user's auth ID
 * @param assignedProjectIds For monteur: IDs from schedule_phases / assignments (pre-fetched)
 */
export function filterProjectsByRole<
  T extends { id: string; bauleiter_id?: string | null },
>(
  projects: T[],
  role: UserRole,
  userId: string | null,
  assignedProjectIds?: Set<string>,
): T[] {
  if (role === "gf") return projects;

  if (!userId) return [];

  if (role === "bauleiter") {
    return projects.filter((p) => p.bauleiter_id === userId);
  }

  if (role === "monteur") {
    if (!assignedProjectIds || assignedProjectIds.size === 0) return [];
    return projects.filter((p) => assignedProjectIds.has(p.id));
  }

  return [];
}

/**
 * Check if a value (e.g. price, margin) should be hidden for the current role.
 * Monteure should never see prices or margins.
 */
export function shouldHideFinancials(role: UserRole): boolean {
  return role === "monteur";
}

/**
 * Labels for the "Kein Zugriff" scenarios per role.
 */
export const ACCESS_DENIED_LABELS: Record<UserRole, string> = {
  gf: "Geschäftsführer",
  bauleiter: "Bauleiter",
  monteur: "Monteur",
};
