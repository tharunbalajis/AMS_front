import { Button, Card, DataTable, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { visitorsApi } from "@/api/visitors.api";
import { useScope } from "@/app/scope/ScopeProvider";

function ResolveModal({ alertId, onClose }: { alertId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");

  const mut = useMutation({
    mutationFn: () => visitorsApi.resolveSos(alertId, { resolution_notes: notes.trim() || null }),
    onSuccess: () => {
      toast.success("Alert resolved");
      qc.invalidateQueries({ queryKey: ["sos-alerts"] });
      onClose();
    },
    onError: () => toast.error("Failed to resolve alert"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">Resolve Alert</h2>
        </div>
        <div className="p-6">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Resolution Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe how the alert was resolved..."
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" disabled={mut.isPending} onClick={() => mut.mutate()}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {mut.isPending && <Loader2 size={14} className="animate-spin" />}
            Mark Resolved
          </button>
        </div>
      </div>
    </div>
  );
}

export function SosEmergencyPage() {
  const { queryParams } = useScope();
  const qc = useQueryClient();
  const [resolveId, setResolveId] = useState<string | null>(null);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["sos-alerts", queryParams],
    queryFn: () => visitorsApi.getSosAlerts({ society_id: queryParams.society_id }),
    retry: false,
  });
  const alerts = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const activeAlerts = alerts.filter((a) => String(a.status ?? "").toUpperCase() !== "RESOLVED");
  const pastAlerts   = alerts.filter((a) => String(a.status ?? "").toUpperCase() === "RESOLVED");

  const ackMut = useMutation({
    mutationFn: (id: string) => visitorsApi.acknowledgeSos(id),
    onSuccess: () => {
      toast.success("Alert acknowledged");
      qc.invalidateQueries({ queryKey: ["sos-alerts"] });
    },
    onError: () => toast.error("Failed to acknowledge"),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / SOS / Emergency</p>
        <h1 className="text-2xl font-bold text-gray-900">SOS / Emergency</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor and respond to emergency alerts</p>
      </div>

      {!isLoading && activeAlerts.length === 0 && (
        <Card className="border-green-200 bg-green-50 p-5">
          <div className="flex items-center gap-3 text-green-700">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <p className="font-medium">No active alerts. All clear.</p>
          </div>
        </Card>
      )}

      {activeAlerts.map((alert) => (
        <Card key={String(alert.id)} className="border-red-300 bg-red-50 p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-red-100 p-3 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="animate-pulse rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {String(alert.status ?? "ACTIVE")}
                </span>
                <h2 className="text-lg font-bold text-red-900">{String(alert.alert_type ?? "Emergency")}</h2>
              </div>
              <p className="mt-1 text-sm text-red-700">
                Unit {String(alert.unit_number ?? "-")} · Reported by: {String(alert.resident_name ?? "-")}
              </p>
              <p className="text-xs text-red-500 mt-1">{String(alert.created_at ?? "-")}</p>
            </div>
            <div className="flex gap-2">
              {String(alert.status ?? "").toUpperCase() === "ACTIVE" && (
                <Button variant="secondary"
                  onClick={() => ackMut.mutate(String(alert.id))}
                  disabled={ackMut.isPending}>
                  {ackMut.isPending ? <Loader2 size={14} className="animate-spin" /> : "Acknowledge"}
                </Button>
              )}
              <Button variant="secondary"
                className="border-green-500 text-green-700 hover:bg-green-50"
                onClick={() => setResolveId(String(alert.id))}>
                <CheckCircle size={15} className="mr-1" />Resolve
              </Button>
            </div>
          </div>
        </Card>
      ))}

      <DataTable
        title="Past Alerts"
        rows={pastAlerts}
        isLoading={isLoading}
        columns={[
          { key: "alert_type",    header: "TYPE",       render: (row) => <span className="font-medium text-red-700">{String(row.alert_type ?? "-")}</span> },
          { key: "unit_number",   header: "UNIT" },
          { key: "resident_name", header: "REPORTED BY" },
          { key: "created_at",    header: "TIME" },
          { key: "status",        header: "STATUS", render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />

      {resolveId && <ResolveModal alertId={resolveId} onClose={() => setResolveId(null)} />}
    </div>
  );
}
