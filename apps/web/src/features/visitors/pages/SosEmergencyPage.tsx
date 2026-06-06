import { Button, Card, DataTable, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { visitorsApi } from "@/api/visitors.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 2, alert_type: "Fire Alarm", unit_number: "B-202", reported_by: "Priya Patel", location: "Block B, Floor 2", created_at: "2024-01-14 11:15", status: "RESOLVED" },
  { id: 3, alert_type: "Theft", unit_number: "C-305", reported_by: "Rahul Kumar", location: "Parking Area C", created_at: "2024-01-13 03:45", status: "RESOLVED" },
  { id: 4, alert_type: "Medical Emergency", unit_number: "A-204", reported_by: "Sneha Gupta", location: "Unit A-204", created_at: "2024-01-12 08:20", status: "RESOLVED" },
];

export function SosEmergencyPage() {
  const { queryParams } = useScope();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["sos-alerts", queryParams],
    queryFn: () => visitorsApi.getSosAlerts({ ...queryParams }),
    retry: false,
  });
  const alerts = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const activeAlert = alerts.find((a) => String(a.status ?? "").toUpperCase() !== "RESOLVED");
  const pastAlerts = alerts.length ? alerts.filter((a) => String(a.status ?? "").toUpperCase() === "RESOLVED") : MOCK;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / SOS / Emergency</p>
        <h1 className="text-2xl font-bold text-gray-900">SOS / Emergency</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor and respond to emergency alerts</p>
      </div>

      {activeAlert ? (
        <Card className="border-red-300 bg-red-50 p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-red-100 p-3 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="animate-pulse rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">ACTIVE</span>
                <h2 className="text-lg font-bold text-red-900">{String(activeAlert.alert_type ?? "Emergency")}</h2>
              </div>
              <p className="mt-1 text-sm text-red-700">Unit {String(activeAlert.unit_number ?? "-")} · Reported by: {String(activeAlert.reported_by ?? "-")}</p>
              <p className="text-sm text-red-700">Location: {String(activeAlert.location ?? "-")}</p>
              <p className="text-xs text-red-500 mt-1">{String(activeAlert.created_at ?? "-")}</p>
            </div>
            <Button variant="danger" onClick={() => {}}>Acknowledge</Button>
          </div>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50 p-5">
          <div className="flex items-center gap-3 text-green-700">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <p className="font-medium">No active alerts. All clear.</p>
          </div>
        </Card>
      )}

      <DataTable
        title="Past Alerts"
        rows={pastAlerts}
        isLoading={isLoading}
        columns={[
          { key: "alert_type", header: "TYPE", render: (row) => <span className="font-medium text-red-700">{String(row.alert_type ?? "-")}</span> },
          { key: "unit_number", header: "UNIT" },
          { key: "reported_by", header: "REPORTED BY" },
          { key: "location", header: "LOCATION" },
          { key: "created_at", header: "TIME" },
          { key: "status", header: "STATUS", render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
    </div>
  );
}
