
import { useQuery } from "@tanstack/react-query";
import { residentsApi } from "@/api/residents.api";
import { QK } from "@/lib/queryKeys";

export function useDynamicBlocks(societyId?: number) {
  return useQuery({
    queryKey: QK.blocks(societyId ?? 0),
    queryFn: () => residentsApi.getBlocks({ society_id: societyId }),
    enabled: !!societyId,
    staleTime: 30_000,
    select: (data) => (Array.isArray(data) ? data : []),
  });
}
