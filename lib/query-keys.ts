export const queryKeys = {
  activities: {
    all: ["activities"] as const,
    list: () => ["activities", "list"] as const,
  },
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
  finance: {
    all: ["finance"] as const,
    overview: () => ["finance", "overview"] as const,
    projectControlling: () => ["finance", "projectControlling"] as const,
    costsByCategory: () => ["finance", "costsByCategory"] as const,
    purchaseInvoices: () => ["finance", "purchaseInvoices"] as const,
    salesInvoices: () => ["finance", "salesInvoices"] as const,
    changeOrders: () => ["finance", "changeOrders"] as const,
  },
  invoices: {
    all: ["invoices"] as const,
    list: () => ["invoices", "list"] as const,
    detail: (invoiceId: string) => ["invoices", "detail", invoiceId] as const,
    previousAbschlaege: (projectId: string) => ["invoices", "abschlaege", projectId] as const,
  },
  clients: {
    all: ["clients"] as const,
    list: () => ["clients", "list"] as const,
  },
  textBlocks: {
    all: ["textBlocks"] as const,
    byCategory: (category: string) => ["textBlocks", category] as const,
  },
  chat: {
    all: ["chat"] as const,
    history: (projectId: string) => ["chat", "history", projectId] as const,
  },
  pipeline: {
    all: ["pipeline"] as const,
    run: (projectId: string) => ["pipeline", "run", projectId] as const,
    steps: (runId: string) => ["pipeline", "steps", runId] as const,
  },
} as const;
