export const queryKeys = {
  approvals: {
    all: ["approvals"] as const,
    list: () => ["approvals", "list"] as const,
    count: () => ["approvals", "count"] as const,
  },
  dashboard: {
    metrics: () => ["dashboard", "metrics"] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: (filters?: Record<string, unknown>) => ["projects", "list", filters ?? {}] as const,
    detail: (projectId: string) => ["projects", "detail", projectId] as const,
  },
} as const;
