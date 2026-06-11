import { Button, DataTable, SearchBox, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, QrCode, X } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { visitorsApi } from "@/api/visitors.api";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

function AddPassModal({
  societyId,
  onClose,
  onCreated,
}: {
  societyId: number;
  onClose: () => void;
  onCreated: (pass: Record<string, unknown>) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    resident_id: "", unit_id: "", visitor_name: "", visitor_mobile: "",
    valid_from: "", valid_until: "", pass_purpose: "",
  });

  const residentsQuery = useQuery({
    queryKey: ["residents-simple", societyId],
    queryFn: () => residentsApi.getAll({ society_id: societyId, page: 1, page_size: 200 }),
  });
  const residents = normalizeList<Record<string, unknown>>(residentsQuery.data?.data ?? residentsQuery.data);

  const mut = useMutation({
    mutationFn: () => visitorsApi.addPass({
      unit_id:        Number(form.unit_id),
      resident_id:    form.resident_id,
      visitor_name:   form.visitor_name.trim(),
      visitor_mobile: form.visitor_mobile.trim() || null,
      valid_from:     form.valid_from,
      valid_until:    form.valid_until,
      pass_purpose:   form.pass_purpose.trim() || null,
    }),
    onSuccess: (res: any) => {
      const pass = res?.data?.data ?? res?.data ?? res;
      toast.success("Guest pass created");
      qc.invalidateQueries({ queryKey: ["guest-passes"] });
      if (pass?.qr_token) {
        onCreated(pass);
      } else {
        onClose();
      }
    },
    onError: (e: unknown) => toast.error((e as Error)?.message ?? "Failed to create pass"),
  });

  const cls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  const isValid = form.resident_id && form.visitor_name.trim() && form.valid_from && form.valid_until;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">Create Guest Pass</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6">
          <label className="col-span-2 block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Resident *</span>
            <select value={form.resident_id}
              onChange={(e) => {
                const r = residents.find((x) => String(x.id ?? x.resident_id) === e.target.value);
                setForm((f) => ({ ...f, resident_id: e.target.value, unit_id: r ? String(r.unit_id ?? "") : "" }));
              }}
              className={cls}>
              <option value="">Select resident</option>
              {residents.map((r) => (
                <option key={String(r.id ?? r.resident_id)} value={String(r.id ?? r.resident_id)}>
                  {String(r.full_name ?? "-")} — {String(r.unit_number ?? "")}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Visitor Name *</span>
            <input value={form.visitor_name}
              onChange={(e) => setForm((f) => ({ ...f, visitor_name: e.target.value }))}
              placeholder="Guest full name" className={cls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Visitor Mobile</span>
            <input value={form.visitor_mobile}
              onChange={(e) => setForm((f) => ({ ...f, visitor_mobile: e.target.value }))}
              placeholder="10-digit mobile" className={cls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Valid From *</span>
            <input type="date" value={form.valid_from}
              onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))} className={cls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Valid Until *</span>
            <input type="date" value={form.valid_until}
              onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))} className={cls} />
          </label>
          <label className="col-span-2 block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Purpose</span>
            <input value={form.pass_purpose}
              onChange={(e) => setForm((f) => ({ ...f, pass_purpose: e.target.value }))}
              placeholder="e.g. Regular domestic help, Caretaker" className={cls} />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" disabled={!isValid || mut.isPending} onClick={() => mut.mutate()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {mut.isPending && <Loader2 size={14} className="animate-spin" />}
            Create Pass
          </button>
        </div>
      </div>
    </div>
  );
}

function PassQrModal({ pass, onClose }: { pass: Record<string, unknown>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">Guest Pass QR Code</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="flex flex-col items-center gap-4 p-6">
          <p className="text-sm text-gray-600">{String(pass.visitor_name ?? "")}</p>
          <div className="pass-qr-code bg-white p-3 rounded border">
            <QRCode value={String(pass.qr_token ?? pass.id ?? "")} size={180} />
          </div>
          <button
            onClick={() => {
              const svg = document.querySelector(".pass-qr-code svg");
              if (!svg) return;
              const svgData = new XMLSerializer().serializeToString(svg);
              const blob = new Blob([svgData], { type: "image/svg+xml" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `pass-qr-${String(pass.id ?? "pass")}.svg`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Download QR
          </button>
          <p className="text-xs text-gray-400 text-center">Share this QR with the visitor for gate entry</p>
          <button type="button" onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function GuestPassesPage() {
  const { queryParams, society } = useScope();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [createdPass, setCreatedPass] = useState<Record<string, unknown> | null>(null);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["guest-passes", queryParams],
    queryFn: () => visitorsApi.getPasses({ society_id: queryParams.society_id }),
    retry: false,
  });
  const rows = normalizeList<Record<string, unknown>>(
    (raw as any)?.data?.data?.data ?? (raw as any)?.data?.data ?? raw?.data ?? raw
  ).filter(
    (r) => !search
      || String(r.visitor_name ?? "").toLowerCase().includes(search.toLowerCase())
      || String(r.resident_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Visitor & Security / Guest Passes</p>
          <h1 className="text-2xl font-bold text-gray-900">Guest Passes</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} passes issued</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={15} className="mr-1" />New Pass</Button>
      </div>

      <SearchBox className="max-w-md" placeholder="Search guest name, resident..."
        value={search} onChange={(e) => setSearch(e.target.value)} />

      <DataTable
        title="Guest Passes"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "visitor_name",  header: "GUEST" },
          { key: "resident_name", header: "RESIDENT" },
          { key: "unit_number",   header: "UNIT" },
          { key: "valid_from",    header: "FROM" },
          { key: "valid_until",   header: "TO" },
          { key: "pass_purpose",  header: "PURPOSE" },
          {
            key: "is_active", header: "STATUS",
            render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "CLOSED"} />,
          },
          {
            key: "qr", header: "QR",
            render: () => (
              <button type="button" className="rounded p-1 text-gray-400 hover:text-blue-600">
                <QrCode size={16} />
              </button>
            ),
          },
        ]}
      />

      {addOpen && (
        <AddPassModal
          societyId={Number(society?.society_id ?? queryParams.society_id ?? 1)}
          onClose={() => setAddOpen(false)}
          onCreated={(pass) => { setAddOpen(false); setCreatedPass(pass); }}
        />
      )}

      {createdPass && (
        <PassQrModal pass={createdPass} onClose={() => setCreatedPass(null)} />
      )}
    </div>
  );
}
