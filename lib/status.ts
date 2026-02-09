export type ProjectStatus = "kritisch" | "achtung" | "laeuft" | "fertig";

const DB_STATUS_MAP: Record<string, ProjectStatus> = {
  INTAKE: "achtung",
  DRAFT: "achtung",
  ACTIVE: "laeuft",
  PLANNING: "laeuft",
  IN_PROGRESS: "laeuft",
  INSPECTION: "achtung",
  COMPLETION: "achtung",
  ON_HOLD: "kritisch",
  COMPLETED: "fertig",
  CANCELLED: "kritisch",
};

export function mapDbStatus(dbStatus: string | null): ProjectStatus {
  if (!dbStatus) return "achtung";
  return DB_STATUS_MAP[dbStatus] ?? "achtung";
}
