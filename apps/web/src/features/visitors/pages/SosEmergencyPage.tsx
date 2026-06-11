import { Button, Card, DataTable, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { residentsApi } from "@/api/residents.api";
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
  const [showForm, setShowForm] = useState(false);
  const [sosForm, setSosForm] = useState({
    alert_type: "GENERAL",
    unit_id: "",
    description: "",
    latitude: "",
    longitude: "",
  });

  const { data: raw, isLoading } = useQuery({
    queryKey: ["sos-alerts", queryParams],
    queryFn: () => visitorsApi.getSosAlerts({ society_id: queryParams.society_id }),
    retry: false,
  });
  const alerts = normalizeList<Record<string, unknown>>(
    (raw as any)?.data?.data?.data ?? (raw as any)?.data?.data ?? raw?.data ?? raw
  );
  const activeAlerts = alerts.filter((a) => String(a.status ?? "").toUpperCase() !== "RESOLVED");
  const pastAlerts   = alerts.filter((a) => String(a.status ?? "").toUpperCase() === "RESOLVED");

  const unitsQuery = useQuery({
    queryKey: ["units-sos", queryParams.society_id],
    queryFn: () => residentsApi.getUnits({ society_id: queryParams.society_id, page: 1, page_size: 300 }),
    enabled: Boolean(queryParams.society_id),
  });
  const units = normalizeList<Record<string, unknown>>(unitsQuery.data?.data ?? unitsQuery.data);

  const ackMut = useMutation({
    mutationFn: (id: string) => visitorsApi.acknowledgeSos(id),
    onSuccess: () => {
      toast.success("Alert acknowledged");
      qc.invalidateQueries({ queryKey: ["sos-alerts"] });
    },
    onError: () => toast.error("Failed to acknowledge"),
  });

  const sosMut = useMutation({
    mutationFn: () =>
      visitorsApi.createSosAlert({
        alert_type: sosForm.alert_type,
        unit_id: sosForm.unit_id ? Number(sosForm.unit_id) : undefined,
        description: sosForm.description.trim() || undefined,
        latitude: sosForm.latitude ? Number(sosForm.latitude) : undefined,
        longitude: sosForm.longitude ? Number(sosForm.longitude) : undefined,
      }),
    onSuccess: () => {
      toast.success("SOS alert raised!");
      qc.invalidateQueries({ queryKey: ["sos-alerts"] });
      setShowForm(false);
      setSosForm({ alert_type: "GENERAL", unit_id: "", description: "", latitude: "", longitude: "" });
    },
    onError: () => toast.error("Failed to raise SOS alert"),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / SOS / Emergency</p>
        <h1 className="text-2xl font-bold text-gray-900">SOS / Emergency</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor and respond to emergency alerts</p>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Raise SOS Alert</h2>
          <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : <><AlertTriangle size={14} className="mr-1" />Raise Alert</>}
          </Button>
        </div>

        {showForm && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Alert Type *</label>
                <select
                  value={sosForm.alert_type}
                  onChange={(e) => setSosForm((f) => ({ ...f, alert_type: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-500"
                >
                  <option value="GENERAL">General Emergency</option>
                  <option value="FIRE">Fire</option>
                  <option value="MEDICAL">Medical</option>
                  <option value="INTRUDER">Intruder</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Unit (optional)</label>
                <select
                  value={sosForm.unit_id}
                  onChange={(e) => setSosForm((f) => ({ ...f, unit_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-500"
                >
                  <option value="">Select unit</option>
                  {units.map((u) => (
                    <option key={String(u.unit_id ?? u.id)} value={String(u.unit_id ?? u.id)}>
                      {String(u.unit_number ?? "-")} {u.block_name ? `- ${u.block_name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={2}
                value={sosForm.description}
                onChange={(e) => setSosForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Briefly describe the emergency..."
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-500"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Latitude (optional)</label>
                <input
                  type="number"
                  step="any"
                  value={sosForm.latitude}
                  onChange={(e) => setSosForm((f) => ({ ...f, latitude: e.target.value }))}
                  placeholder="e.g. 17.3850"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Longitude (optional)</label>
                <input
                  type="number"
                  step="any"
                  value={sosForm.longitude}
                  onChange={(e) => setSosForm((f) => ({ ...f, longitude: e.target.value }))}
                  placeholder="e.g. 78.4867"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-500"
                />
              </div>
            </div>
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={sosMut.isPending}
              onClick={() => sosMut.mutate()}
            >
              {sosMut.isPending
                ? <Loader2 size={14} className="mr-1 animate-spin" />
                : <AlertTriangle size={14} className="mr-1" />}
              Confirm SOS Alert
            </Button>
          </div>
        )}
      </Card>

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
