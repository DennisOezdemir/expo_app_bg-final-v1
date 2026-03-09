import { createContext, useContext, useState, useMemo, ReactNode, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "gf" | "bauleiter" | "monteur";

interface RoleUser {
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
}

interface RoleContextValue {
  role: UserRole;
  user: RoleUser;
  actualRole: UserRole;
  isImpersonating: boolean;
  setRole: (role: UserRole) => void;
  resetRole: () => void;
  can: (action: RoleAction) => boolean;
  sees: (section: ViewSection) => boolean;
}

type RoleAction =
  | "approve"
  | "reject"
  | "order_material"
  | "change_prices"
  | "send_invoices"
  | "plan_team"
  | "take_photos"
  | "log_time"
  | "report_defect"
  | "send_offers"
  | "view_margin"
  | "create_mahnung";

type ViewSection =
  | "financials"
  | "margin"
  | "invoices"
  | "mahnungen"
  | "freigaben"
  | "material_prices"
  | "project_prices"
  | "angebote"
  | "planung"
  | "begehungen"
  | "zeiterfassung"
  | "budget"
  | "all_projects";

const FALLBACK_USERS: Record<UserRole, RoleUser> = {
  gf: { name: "Dennis", email: "dennis@bauloewen.de", role: "gf", roleLabel: "Geschäftsführer" },
  bauleiter: { name: "Ayse", email: "ayse@bauloewen.de", role: "bauleiter", roleLabel: "Bauleiterin" },
  monteur: { name: "Mehmet", email: "mehmet@bauloewen.de", role: "monteur", roleLabel: "Monteur" },
};

const ROLE_PERMISSIONS: Record<UserRole, Set<RoleAction>> = {
  gf: new Set([
    "approve", "reject", "order_material", "change_prices", "send_invoices",
    "plan_team", "take_photos", "log_time", "report_defect", "send_offers",
    "view_margin", "create_mahnung",
  ]),
  bauleiter: new Set([
    "order_material", "plan_team", "take_photos", "report_defect",
  ]),
  monteur: new Set([
    "take_photos", "log_time", "report_defect",
  ]),
};

const ROLE_VIEWS: Record<UserRole, Set<ViewSection>> = {
  gf: new Set([
    "financials", "margin", "invoices", "mahnungen", "freigaben",
    "material_prices", "project_prices", "angebote", "planung",
    "begehungen", "zeiterfassung", "budget", "all_projects",
  ]),
  bauleiter: new Set([
    "material_prices", "angebote", "planung", "begehungen", "all_projects",
  ]),
  monteur: new Set([
    "zeiterfassung",
  ]),
};

const RoleContext = createContext<RoleContextValue | null>(null);

function normalizeUserRole(role?: string | null): UserRole {
  const normalized = role?.trim().toLowerCase();

  switch (normalized) {
    case "gf":
    case "geschäftsführer":
    case "geschaeftsfuehrer":
      return "gf";
    case "bauleiter":
    case "bauleiterin":
    case "polier":
      return "bauleiter";
    case "monteur":
    case "techniker":
    case "handwerker":
      return "monteur";
    default:
      return "gf";
  }
}

function getRoleLabel(role: UserRole, authRoleLabel?: string | null): string {
  if (authRoleLabel?.trim()) return authRoleLabel.trim();
  return FALLBACK_USERS[role].roleLabel;
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isAuthenticated } = useAuth();
  const actualRole = useMemo<UserRole>(
    () => normalizeUserRole(isAuthenticated ? authUser?.role : undefined),
    [authUser?.role, isAuthenticated]
  );
  const [overrideRole, setOverrideRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setOverrideRole(null);
  }, [actualRole]);

  const role = overrideRole ?? actualRole;
  const isImpersonating = overrideRole !== null && overrideRole !== actualRole;

  const setRole = useCallback((newRole: UserRole) => {
    setOverrideRole(newRole === actualRole ? null : newRole);
  }, [actualRole]);

  const resetRole = useCallback(() => {
    setOverrideRole(null);
  }, []);

  const can = useCallback((action: RoleAction) => {
    return ROLE_PERMISSIONS[role].has(action);
  }, [role]);

  const sees = useCallback((section: ViewSection) => {
    return ROLE_VIEWS[role].has(section);
  }, [role]);

  const fallbackUser = FALLBACK_USERS[role];

  const user = useMemo<RoleUser>(() => {
    if (!authUser) {
      return fallbackUser;
    }

    return {
      name: authUser.name || fallbackUser.name,
      email: authUser.email || fallbackUser.email,
      role,
      roleLabel: getRoleLabel(role, isImpersonating ? undefined : authUser.roleLabel),
    };
  }, [authUser, fallbackUser, role, isImpersonating]);

  const value = useMemo(() => ({
    role,
    user,
    actualRole,
    isImpersonating,
    setRole,
    resetRole,
    can,
    sees,
  }), [role, user, actualRole, isImpersonating, setRole, resetRole, can, sees]);

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
