import { Button, DataTable, SearchBox, Select } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

function AddVehicleModal({ societyId, onClose }: { societyId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ resident_id: "", unit_id: "", vehicle_type: "CAR", make: "", model: "", color: "", registration_no: "", parking_slot: "" });

  const residentsQuery = useQuery({
    queryKey: ["residents-simple", societyId],
    queryFn: () => residentsApi.getAll({ society_id: societyId, page: 1, page_size: 200 }),
  });
  const residents = normalizeList<Record<string, unknown>>(residentsQuery.data?.data ?? residentsQuery.data);
  console.log(residents);
  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        society_id: societyId,
        unit_id: Number(form.unit_id),
      };

      console.log("ADD VEHICLE PAYLOAD", payload);

      return residentsApi.addVehicle(payload);
    },
    onSuccess: () => { toast.success("Vehicle added"); qc.invalidateQueries({ queryKey: ["vehicles"] }); onClose(); },
    onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to add vehicle"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">Add Vehicle</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6">
          <label className="col-span-2 block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Resident *</span>
            <select value={form.resident_id}
              onChange={e => {
                const r = residents.find(x => String(x.id) === e.target.value);
                setForm(f => ({ ...f, resident_id: e.target.value, unit_id: r ? String(r.unit_id ?? "") : "" }));
              }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="">Select resident</option>
              {residents.map(r => <option key={String(r.id)} value={String(r.id)}>{String(r.full_name)} — {String(r.unit_number ?? "")}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Registration No *</span>
            <input value={form.registration_no} onChange={e => setForm(f => ({ ...f, registration_no: e.target.value }))} placeholder="KA-01-AB-1234"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Type *</span>
            <select value={form.vehicle_type} onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {["CAR","BIKE","TRUCK","SCOOTER","OTHER"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Make</span>
            <input value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} placeholder="Maruti, Honda..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Model</span>
            <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="Swift, City..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Color</span>
            <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="White, Black..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Parking Slot</span>
            <input value={form.parking_slot} onChange={e => setForm(f => ({ ...f, parking_slot: e.target.value }))} placeholder="P-01"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
          <button disabled={!form.resident_id || !form.registration_no || mutation.isPending} onClick={() => mutation.mutate()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />} Add Vehicle
          </button>
        </div>
      </div>
    </div>
  );
}

export function VehicleManagementPage() {
  const { queryParams, society } = useScope();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["vehicles", queryParams, search, type],
    queryFn: () => residentsApi.getVehicles({ ...queryParams, search: search || undefined, vehicle_type: type || undefined }),
    retry: false,
  });

  const rows = normalizeList<Record<string, unknown>>(raw?.data ?? raw);

  const handleExportCsv = () => {
    const headers = [ "registration_no", "vehicle_type", "make", "model", "color", "full_name", "block_name", "unit_number", "parking_slot" ];
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "vehicles.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Residents / Vehicle Management</p>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="mt-1 text-sm text-gray-500">{isLoading ? "Loading..." : `${rows.length} registered vehicles`}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCsv}>Export CSV</Button>
          <Button onClick={() => setAddOpen(true)}><Car size={15} className="mr-1" />Add Vehicle</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBox className="min-w-[240px] flex-1" placeholder="Search registration, owner..." value={search} onChange={e => setSearch(e.target.value)} />
        <Select className="w-40" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          {["CAR","BIKE","TRUCK","SCOOTER","OTHER"].map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
      </div>

      {!isLoading && rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Car size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">No vehicles registered</p>
          <p className="mt-1 text-sm text-gray-400">Click "Add Vehicle" to register a vehicle.</p>
        </div>
      ) : (
        <DataTable
          title="Vehicles"
          rows={rows.map((r, i) => ({ ...r, __rowKey: r.id ?? i }))}
          isLoading={isLoading}
          columns={[
            { key: "registration_no", header: "VEHICLE NO", render: row => <span className="font-mono font-medium">{String(row.registration_no ?? "-")}</span> },
            { key: "vehicle_type", header: "TYPE" },
            { key: "make", header: "MAKE/MODEL", render: row => <span>{[row.make, row.model].filter(Boolean).join(" ") || "—"}</span> },
            { key: "color", header: "COLOR" },
            { key: "full_name", header: "OWNER", render: row => ( <span> {String( row.full_name ?? row.owner_name ?? row.resident_name ?? "-" )} </span> ) },
            { key: "block_name", header: "BLOCK" },
            { key: "unit_number", header: "UNIT" },
            { key: "parking_slot", header: "PARKING" },
          ]}
        />
      )}

      {addOpen && <AddVehicleModal societyId={society?.society_id ?? 1} onClose={() => setAddOpen(false)} />}
    </div>
  );
}
