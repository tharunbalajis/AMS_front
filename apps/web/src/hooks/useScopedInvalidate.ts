
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { QK } from "@/lib/queryKeys";

export function useScopedInvalidate() {
  const qc = useQueryClient();

  const invalidateAfterResidentChange = useCallback(
    (societyId: number, blockId?: number) => {
      qc.invalidateQueries({ queryKey: QK.residents(societyId, blockId) });
      qc.invalidateQueries({ queryKey: QK.units(societyId, blockId) });
      qc.invalidateQueries({ queryKey: QK.blocks(societyId) });
      qc.invalidateQueries({ queryKey: QK.dashboardStats(societyId) });
      qc.invalidateQueries({ queryKey: QK.occupancyHeatmap(societyId) });
    },
    [qc]
  );

  const invalidateAfterUnitChange = useCallback(
    (societyId: number, blockId?: number) => {
      qc.invalidateQueries({ queryKey: QK.units(societyId, blockId) });
      qc.invalidateQueries({ queryKey: QK.blocks(societyId) });
      qc.invalidateQueries({ queryKey: QK.dashboardStats(societyId) });
      qc.invalidateQueries({ queryKey: QK.occupancyHeatmap(societyId) });
    },
    [qc]
  );

  const clearSocietyCache = useCallback(
    (societyId: number) => {
      qc.removeQueries({ queryKey: ["residents", societyId] });
      qc.removeQueries({ queryKey: ["units", societyId] });
      qc.removeQueries({ queryKey: ["blocks", societyId] });
      qc.removeQueries({ queryKey: ["leases", societyId] });
      qc.removeQueries({ queryKey: ["vehicles", societyId] });
      qc.removeQueries({ queryKey: ["pets", societyId] });
      qc.removeQueries({ queryKey: ["dashboard-stats", societyId] });
      qc.removeQueries({ queryKey: ["occupancy-heatmap", societyId] });
    },
    [qc]
  );

  return {
    invalidateAfterResidentChange,
    invalidateAfterUnitChange,
    clearSocietyCache,
  };
}
