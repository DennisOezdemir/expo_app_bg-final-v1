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
    actions: () => ["dashboard", "actions"] as const,
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
  monteur: {
    all: ["monteur"] as const,
    aufgaben: (teamMemberId: string) => ["monteur", "aufgaben", teamMemberId] as const,
    teamMember: (email: string) => ["monteur", "teamMember", email] as const,
  },
  zeiterfassung: {
    all: ["zeiterfassung"] as const,
    today: (teamMemberId: string) => ["zeiterfassung", "today", teamMemberId] as const,
    week: (teamMemberId: string) => ["zeiterfassung", "week", teamMemberId] as const,
  },
  fotos: {
    all: ["fotos"] as const,
    recent: (teamMemberId: string) => ["fotos", "recent", teamMemberId] as const,
  },
  offers: {
    all: ["offers"] as const,
    detail: (offerId: string) => ["offers", "detail", offerId] as const,
    withSections: (offerId: string) => ["offers", "withSections", offerId] as const,
    byProject: (projectId: string) => ["offers", "byProject", projectId] as const,
  },
  catalogs: {
    all: ["catalogs"] as const,
    positions: (catalogId: string, query?: string, trade?: string) =>
      ["catalogs", "positions", catalogId, query ?? "", trade ?? ""] as const,
  },
  changeOrders: {
    all: ["changeOrders"] as const,
    byProject: (projectId: string) => ["changeOrders", "project", projectId] as const,
    detail: (id: string) => ["changeOrders", "detail", id] as const,
  },
  materials: {
    all: ["materials"] as const,
    projects: () => ["materials", "projects"] as const,
    needs: (projectId: string) => ["materials", "needs", projectId] as const,
    products: (name?: string, trade?: string) =>
      ["materials", "products", name ?? "", trade ?? ""] as const,
    suppliers: () => ["materials", "suppliers"] as const,
  },
  settings: {
    all: ["settings"] as const,
    company: () => ["settings", "company"] as const,
    team: () => ["settings", "team"] as const,
  },
  planning: {
    all: ["planning"] as const,
    week: (weekStart: string, weekEnd: string) =>
      ["planning", "week", weekStart, weekEnd] as const,
    month: (year: number, month: number) =>
      ["planning", "month", year, month] as const,
    projectDetail: (projectId: string) =>
      ["planning", "projectDetail", projectId] as const,
  },
  auftrag: {
    all: ["auftrag"] as const,
    detail: (projectId: string) => ["auftrag", "detail", projectId] as const,
  },
  begehung: {
    all: ["begehung"] as const,
    projectInfo: (projectId: string) => ["begehung", "projectInfo", projectId] as const,
    rooms: (projectId: string, offerId?: string) =>
      ["begehung", "rooms", projectId, offerId ?? ""] as const,
  },
  suppliers: {
    all: ["suppliers"] as const,
    list: () => ["suppliers", "list"] as const,
    detail: (supplierId: string) => ["suppliers", "detail", supplierId] as const,
    articles: (supplierId: string) => ["suppliers", "articles", supplierId] as const,
    companySettings: () => ["suppliers", "companySettings"] as const,
  },
  team: {
    all: ["team"] as const,
    list: () => ["team", "list"] as const,
    detail: (id: string) => ["team", "detail", id] as const,
    stats: () => ["team", "stats"] as const,
  },
  productSearch: (searchText?: string, trade?: string) =>
    ["productSearch", searchText ?? "", trade ?? ""] as const,
} as const;
