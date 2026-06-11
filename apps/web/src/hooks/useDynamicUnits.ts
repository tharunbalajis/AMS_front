
import { useQuery } from "@tanstack/react-query";
import { residentsApi } from "@/api/residents.api";
import { QK } from "@/lib/queryKeys";

export function useDynamicUnits(
  societyId?: number,
  blockId?: number,
  occupancyStatus: string | undefined = "VACANT"
) {
  return useQuery({
    queryKey: QK.units(societyId ?? 0, blockId, occupancyStatus),
    queryFn: () =>
      residentsApi.getUnits({
        society_id:       societyId,
        block_id:         blockId || undefined,
        occupancy_status: occupancyStatus || undefined,
        page:             1,
        page_size:        500,
      }),
    enabled: !!societyId,
    staleTime: 0,
    select: (data) => {
      const raw = (data as any)?.data ?? data ?? [];
      return Array.isArray(raw) ? raw : [];
    },
  });
}
