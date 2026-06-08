import { Button, Card, DataTable, Input, Select, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { residentsApi } from "@/api/residents.api";
import { residentsExtApi } from "@/app/api/client";
import { useScope } from "@/app/scope/ScopeProvider";

const mapResidentType = (v: unknown) => {
  const s = String(v ?? "").toUpperCase();
  return s === "FAMILY" ? "OWNER" : s;
};

export function MoveInOutPage() {
  const { society, queryParams } = useScope();
  const [activeTab, setActiveTab] = useState<"in" | "out">("in");
  const [residentId, setResidentId] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: raw } = useQuery({
    queryKey: ["residents", queryParams],
    queryFn: () => residentsApi.getAll({ ...queryParams, page: 1, page_size: 200, is_active: true }),
    retry: false,
  });
  const residents = normalizeList<Record<string, unknown>>(raw?.data ?? raw ?? []);
  const selectedResident = residents.find((r) => String(r.id ?? "") === residentId);

  // Fetch leases for the society for use when ending tenancy
  const { data: leasesRaw } = useQuery({
    queryKey: ["leases", queryParams],
    queryFn: () => residentsApi.getLeases({ ...queryParams, page: 1, page_size: 500 }),
    retry: false,
  });
  const leases = normalizeList<Record<string, unknown>>(leasesRaw?.data ?? leasesRaw ?? []) ?? [];
  const activeLeaseForSelected = leases.find(l => String(l.tenant_resident_id) === String(residentId) && String(l.status) === 'ACTIVE');

  const { data: recentRaw, refetch: refetchRecent } = useQuery({
    queryKey: ["residents-moves", society?.society_id],
    queryFn: () => residentsApi.getAll({ society_id: society?.society_id, page: 1, page_size: 20 }),
    retry: false,
  });
  const recent = normalizeList<Record<string, unknown>>(recentRaw?.data ?? recentRaw ?? [])
    .filter((r) => r.move_out_date)
    .map((r) => ({ ...r, move_type: "MOVE_OUT", move_date: r.move_out_date, resident_name: r.full_name }));

  const moveOutMutation = useMutation({
    mutationFn: async () => {
      if (!residentId) throw new Error('No resident selected');
      const moveOutDate = date || new Date().toISOString().slice(0,10);

      // if tenant with active lease, end lease and move out in one flow
      if (mapResidentType(selectedResident?.resident_type) === 'TENANT') {
        const lease = leases.find(l => String(l.tenant_resident_id) === String(residentId) && String(l.status) === 'ACTIVE');
        if (lease) {
          const leaseId = String(lease.id ?? lease.lease_id ?? '');
          return residentsApi.endLeaseAndMoveOut(String(residentId), leaseId, moveOutDate);
        }
      }

      return residentsApi.moveOut(String(residentId), { move_out_date: moveOutDate });
    },
    onSuccess: () => {
      toast.success(`${String(selectedResident?.full_name ?? 'Resident')} moved out`);
      setResidentId(""); setDate(""); setNotes("");
      refetchRecent();
    },
    onError: (err: any) => toast.error((err as any)?.response?.data?.message ?? (err as Error)?.message ?? 'Operation failed'),
  });

  const handleSubmit = () => {
    if (!residentId) { toast.error("Please select a resident"); return; }
    if (activeTab === "out") {
      moveOutMutation.mutate();
    } else {
      // redirect to resident directory where Add Resident wizard lives
      window.location.href = '/residents';
    }
  };

  const reset = () => { setResidentId(""); setDate(""); setNotes(""); };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Residents / Move-In / Move-Out</p>
        <h1 className="text-2xl font-bold text-gray-900">Move In / Move Out</h1>
        <p className="mt-1 text-sm text-gray-500">Manage resident transitions</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="p-6">
          <div className="mb-5 flex rounded-lg border border-gray-200 p-1">
            <button type="button" className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${activeTab === "in" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`} onClick={() => setActiveTab("in")}>Move In</button>
            <button type="button" className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${activeTab === "out" ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100"}`} onClick={() => setActiveTab("out")}>Move Out</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Resident</label>
              <Select value={residentId} onChange={(e) => setResidentId(e.target.value)}>
                <option value="">Select resident</option>
                {residents.map((r) => (
                  <option key={String(r.id ?? "")} value={String(r.id ?? "")}>
                    {String(r.full_name ?? "")} — {String(r.unit_number ?? "")}
                  </option>
                ))}
              </Select>
            </div>

            {selectedResident && (
              <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">{String(selectedResident.full_name ?? "")}</p>
                    <p className="text-blue-700">{String(selectedResident.unit_number ?? "")} · {String(selectedResident.block_name ?? "")}</p>
                  </div>
                  <div>
                    <StatusBadge value={String(mapResidentType(selectedResident.resident_type ?? ""))} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-blue-800">
                  <div>Move-in: {String(selectedResident.move_in_date ?? "-")}</div>
                  {activeLeaseForSelected && (
                    <div>Lease ends: {String(activeLeaseForSelected.lease_end ?? activeLeaseForSelected.end ?? "-")}</div>
                  )}
                </div>
                {mapResidentType(selectedResident.resident_type) === 'TENANT' && (
                  <div className="mt-2 rounded-md bg-yellow-50 p-2 text-sm text-yellow-800">Ending this tenant's stay will also close their active lease agreement.</div>
                )}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{activeTab === "in" ? "Move-In Date" : "Move-Out Date"}</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea className="h-20 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" type="button" onClick={reset}>Cancel</Button>
              <Button className="flex-1" type="button" onClick={handleSubmit} disabled={moveOutMutation.isPending}>
                {moveOutMutation.isPending ? "Processing…" : activeTab === "in" ? "Confirm Move-In" : "Confirm Move-Out"}
              </Button>
            </div>
          </div>
        </Card>

        <DataTable
          title="Recent Move-Outs"
          rows={recent}
          columns={[
            { key: "move_type", header: "TYPE", render: (row: any) => <StatusBadge value={row.move_type === "MOVE_IN" ? "ACTIVE" : "CLOSED"} /> },
            { key: "resident_name", header: "RESIDENT" },
            { key: "unit_number", header: "UNIT" },
            { key: "move_date", header: "DATE", render: (row: any) => <span>{String(row.move_date ?? "-")}</span> },
          ]}
        />
      </div>
    </div>
  );
}
