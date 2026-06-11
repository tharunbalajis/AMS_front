import { DataTable, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { patrolApi } from "@/api/patrol.api";
import { useScope } from "@/app/scope/ScopeProvider";

export function PatrolFraudFlagsPage() {
  const { queryParams } = useScope();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["patrol-fraud-flags", queryParams],
    queryFn: () => patrolApi.getFraudFlags({ society_id: queryParams.society_id }),
    retry: false,
  });
  const rows = normalizeList<Record<string, unknown>>(
    (raw as any)?.data?.data?.data ?? (raw as any)?.data?.data ?? (raw as any)?.data ?? raw
  );
  const openCount = rows.filter(r => !r.is_reviewed).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / Security Patrol Monitoring</p>
        <h1 className="text-2xl font-bold text-gray-900">Fraud Flags</h1>
        <p className="mt-1 text-sm text-gray-500">{openCount} unreviewed flag{openCount !== 1 ? "s" : ""}</p>
      </div>
      <DataTable
        title="Fraud Flags"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "guard_id",    header: "GUARD ID" },
          { key: "flag_type",   header: "FLAG TYPE",   render: (r) => <StatusBadge value={r.flag_type} /> },
          { key: "details",     header: "DETAILS" },
          { key: "is_reviewed", header: "REVIEWED",    render: (r) => r.is_reviewed ? "Yes" : "No" },
          { key: "flagged_at",  header: "FLAGGED AT" },
        ]}
      />
    </div>
  );
}
