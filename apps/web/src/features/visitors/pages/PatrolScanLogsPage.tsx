import { DataTable, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { patrolApi } from "@/api/patrol.api";

export function PatrolScanLogsPage() {
  const { patrolId } = useParams<{ patrolId: string }>();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["patrol-scan-logs", patrolId],
    queryFn: () => patrolApi.getScanLogs(patrolId!),
    enabled: Boolean(patrolId),
    retry: false,
  });
  const rows = normalizeList<Record<string, unknown>>(
    (raw as any)?.data?.data?.data ?? (raw as any)?.data?.data ?? (raw as any)?.data ?? raw
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / Patrol History / Scan Logs</p>
        <h1 className="text-2xl font-bold text-gray-900">Scan Logs</h1>
        <p className="mt-1 text-xs text-gray-500 font-mono">Session: {patrolId}</p>
      </div>
      <DataTable
        title="Scan Log"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "label",            header: "QR POINT" },
          { key: "scan_status",      header: "STATUS",      render: (r) => <StatusBadge value={r.scan_status} /> },
          { key: "geo_verified",     header: "GEO OK",      render: (r) => r.geo_verified ? "Yes" : "No" },
          { key: "distance_meters",  header: "DISTANCE (m)" },
          { key: "rejection_reason", header: "REJECTION" },
          { key: "scanned_at",       header: "SCANNED AT" },
        ]}
      />
    </div>
  );
}
