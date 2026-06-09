
export const QK = {
  societies: () => ["societies"] as const,
  blocks: (societyId: number) => ["blocks", societyId] as const,
  units: (societyId: number, blockId?: number) =>
    blockId ? (["units", societyId, blockId] as const) : (["units", societyId] as const),
  residents: (societyId: number, blockId?: number, unitId?: number) => {
    const base: (string | number)[] = ["residents", societyId];
    if (blockId) base.push(blockId);
    if (unitId) base.push(unitId);
    return base;
  },
  leases: (societyId: number) => ["leases", societyId] as const,
  vehicles: (societyId: number) => ["vehicles", societyId] as const,
  pets: (societyId: number) => ["pets", societyId] as const,
  dashboardStats: (societyId: number) => ["dashboard-stats", societyId] as const,
  occupancyHeatmap: (societyId: number) => ["occupancy-heatmap", societyId] as const,
  inactiveOwners: (societyId: number) => ["inactive-owners", societyId] as const,
} as const;
