import { Button, DataTable, SearchBox, Select } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PawPrint, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

function AddPetModal({ societyId, onClose }: { societyId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ resident_id: "", unit_id: "", pet_name: "", species: "DOG", breed: "", vaccination_date: "" });

  const residentsQuery = useQuery({
    queryKey: ["residents-simple", societyId],
    queryFn: () => residentsApi.getAll({ society_id: societyId, page: 1, page_size: 200 }),
  });
  const residents = normalizeList<Record<string, unknown>>(residentsQuery.data?.data ?? residentsQuery.data);

  const mutation = useMutation({
    mutationFn: () => residentsApi.addPet({
      ...form,
      society_id: societyId,
      unit_id: Number(form.unit_id),
      vaccination_date: form.vaccination_date || null,
    }),
    onSuccess: () => { toast.success("Pet added"); qc.invalidateQueries({ queryKey: ["pets"] }); onClose(); },
    onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to add pet"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">Add Pet</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-6">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Resident (Owner) *</span>
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
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Pet Name *</span>
              <input value={form.pet_name} onChange={e => setForm(f => ({ ...f, pet_name: e.target.value }))} placeholder="Buddy"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Species *</span>
              <select value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                {["DOG","CAT","BIRD","FISH","RABBIT","OTHER"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Breed</span>
              <input value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} placeholder="Labrador"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Vaccination Date</span>
              <input type="date" value={form.vaccination_date} onChange={e => setForm(f => ({ ...f, vaccination_date: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
          <button disabled={!form.resident_id || !form.pet_name || mutation.isPending} onClick={() => mutation.mutate()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />} Add Pet
          </button>
        </div>
      </div>
    </div>
  );
}

export function PetManagementPage() {
  const { queryParams, society } = useScope();
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["pets", queryParams, search, species],
    queryFn: () => residentsApi.getPets({ ...queryParams, search: search || undefined, species: species || undefined }),
    retry: false,
  });

  const rows = normalizeList<Record<string, unknown>>(raw?.data ?? raw);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Residents / Pet Management</p>
          <h1 className="text-2xl font-bold text-gray-900">Pet Management</h1>
          <p className="mt-1 text-sm text-gray-500">{isLoading ? "Loading..." : `${rows.length} registered pets`}</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={15} className="mr-1" />Add Pet</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBox className="min-w-[240px] flex-1" placeholder="Search pet name, owner..." value={search} onChange={e => setSearch(e.target.value)} />
        <Select className="w-40" value={species} onChange={e => setSpecies(e.target.value)}>
          <option value="">All Species</option>
          {["DOG","CAT","BIRD","FISH","RABBIT","OTHER"].map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {!isLoading && rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <PawPrint size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">No pets registered</p>
          <p className="mt-1 text-sm text-gray-400">Click "Add Pet" to register a pet.</p>
        </div>
      ) : (
        <DataTable
          title="Pets"
          rows={rows.map((r, i) => ({ ...r, __rowKey: r.id ?? i }))}
          isLoading={isLoading}
          columns={[
            { key: "pet_name", header: "PET NAME", render: row => (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <PawPrint size={14} />
                </div>
                <span className="font-medium">{String(row.pet_name ?? "-")}</span>
              </div>
            )},
            { key: "species", header: "SPECIES" },
            { key: "breed", header: "BREED" },
            { key: "owner_name", header: "OWNER", render: row => <span>{String(row.owner_name ?? row.resident_name ?? "-")}</span> },
            { key: "block_name", header: "BLOCK" },
            { key: "unit_number", header: "UNIT" },
            { key: "vaccination_date", header: "VACCINATED" },
          ]}
        />
      )}

      {addOpen && <AddPetModal societyId={society?.society_id ?? 1} onClose={() => setAddOpen(false)} />}
    </div>
  );
}
