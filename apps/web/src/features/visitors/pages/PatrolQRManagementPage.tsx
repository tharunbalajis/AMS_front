import { Card, DataTable } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QrCode, RefreshCw } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { patrolApi } from "@/api/patrol.api";
import { useScope } from "@/app/scope/ScopeProvider";

export function PatrolQRManagementPage() {
  const { queryParams } = useScope();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ block_name: "", floor_number: 1, label: "", latitude: "", longitude: "", allowed_radius_meters: 30 });

  const { data: raw, isLoading } = useQuery({
    queryKey: ["patrol-qr-points", queryParams],
    queryFn: () => patrolApi.getQrPoints({ society_id: queryParams.society_id }),
    retry: false,
  });
  const points = normalizeList<Record<string, unknown>>((raw as any)?.data ?? raw);

  const createMutation = useMutation({
    mutationFn: () => patrolApi.createQrPoint({
      society_id:            queryParams.society_id,
      block_name:            form.block_name,
      floor_number:          Number(form.floor_number),
      label:                 form.label,
      latitude:              Number(form.latitude) || null,
      longitude:             Number(form.longitude) || null,
      allowed_radius_meters: Number(form.allowed_radius_meters),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["patrol-qr-points"] }); setShowForm(false); toast.success("QR point created"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to create QR point"),
  });

  const regenMutation = useMutation({
    mutationFn: (id: string) => patrolApi.regenerateQrPoint(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["patrol-qr-points"] }); toast.success("QR regenerated"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to regenerate"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">Visitor & Security / Security Patrol Monitoring</p>
          <h1 className="text-2xl font-bold text-gray-900">QR Point Management</h1>
          <p className="mt-1 text-sm text-gray-500">Create, view and regenerate QR codes for patrol checkpoints</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Add QR Point
        </button>
      </div>

      {showForm && (
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">New QR Patrol Point</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { key: "block_name", label: "Block Name", type: "text" },
              { key: "floor_number", label: "Floor", type: "number" },
              { key: "label", label: "Label / Location", type: "text" },
              { key: "latitude", label: "Latitude (optional)", type: "number" },
              { key: "longitude", label: "Longitude (optional)", type: "number" },
              { key: "allowed_radius_meters", label: "Radius (m)", type: "number" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                <input type={f.type} className="w-full rounded border px-3 py-2 text-sm" value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.block_name || !form.label}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {createMutation.isPending ? "Creating..." : "Create QR Point"}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <DataTable
          title="All QR Points"
          rows={points}
          isLoading={isLoading}
          columns={[
            { key: "label",       header: "LABEL" },
            { key: "block_name",  header: "BLOCK" },
            { key: "floor_number",header: "FLOOR" },
            { key: "is_active",   header: "ACTIVE", render: (r) => r.is_active ? "Yes" : "No" },
            { key: "actions",     header: "ACTIONS", render: (r) => (
              <div className="flex gap-2">
                <button onClick={() => setSelected(r)} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><QrCode size={12} /> View QR</button>
                <button onClick={() => regenMutation.mutate(String(r.id))} className="text-xs text-amber-600 hover:underline flex items-center gap-1"><RefreshCw size={12} /> Regen</button>
              </div>
            )},
          ]}
        />
        {selected && (
          <Card className="p-5 flex flex-col items-center gap-4">
            <h2 className="text-base font-semibold">{String(selected.label)}</h2>
            <p className="text-xs text-gray-500">{String(selected.block_name ?? "")} - Floor {String(selected.floor_number ?? "")}</p>
            <div className="bg-white p-3 rounded border"><QRCode value={String(selected.qr_payload ?? selected.id ?? "")} size={180} /></div>
            <p className="text-xs text-gray-500">Radius: {String(selected.allowed_radius_meters ?? "30")}m</p>
            <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">Close</button>
          </Card>
        )}
      </div>
    </div>
  );
}
