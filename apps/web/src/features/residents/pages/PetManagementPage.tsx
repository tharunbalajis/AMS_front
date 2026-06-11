import { Button, DataTable, SearchBox, Select } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PawPrint, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";
import { PetFormFields, EMPTY_PET, type PetFormData } from "../components/PetFormFields";

const mapResidentType = (v: unknown) => {
  const s = String(v ?? "").toUpperCase();
  return s === "FAMILY" ? "OWNER" : s;
};

function AddPetModal({ societyId, onClose }: { societyId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [residentId, setResidentId] = useState("");
  const [petForm, setPetForm] = useState<PetFormData>({ ...EMPTY_PET });

  const residentsQuery = useQuery({
    queryKey: ["residents-simple", societyId],
    queryFn: () => residentsApi.getAll({ society_id: societyId, is_active: true, page: 1, page_size: 200 }),
    enabled: !!societyId,
  });
  const residents = normalizeList<Record<string, unknown>>(residentsQuery.data?.data ?? residentsQuery.data);
  const today = new Date().toISOString().slice(0, 10);
  const residentsFiltered = (residents ?? []).filter(r => {
    const isActive = Boolean(r.is_active);
    const type = mapResidentType(r.resident_type);
    const moveOut = r.move_out_date ? String(r.move_out_date).slice(0, 10) : null;
    if (!isActive) return false;
    if (moveOut && moveOut < today) return false;
    return type === "OWNER" || type === "TENANT";
  });

  const mutation = useMutation({
    mutationFn: () => residentsApi.addPet({
      resident_id: residentId,
      society_id: societyId,
      ...petForm,
      age_years:         petForm.age_years        ? Number(petForm.age_years)  : null,
      weight_kg:         petForm.weight_kg        ? Number(petForm.weight_kg)  : null,
      vaccination_date:  petForm.vaccination_date || null,
      nickname:          petForm.nickname         || null,
      color:             petForm.color            || null,
      gender:            petForm.gender           || null,
      medical_notes:     petForm.medical_notes    || null,
      notes:             petForm.notes            || null,
    }),
    onSuccess: () => { toast.success("Pet added"); qc.invalidateQueries({ queryKey: ["pets"] }); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? (e as Error).message ?? "Failed to add pet"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">Add Pet</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="max-h-[72vh] space-y-4 overflow-y-auto p-6">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Resident *</span>
            <select
              value={residentId}
              onChange={e => setResidentId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              disabled={residentsQuery.isLoading}
            >
              {residentsQuery.isLoading ? <option>Loading...</option> : <option value="">Select resident</option>}
              {residentsFiltered.map(r => {
                const rid = String(r.resident_id ?? r.id ?? "");
                return <option key={rid} value={rid}>{String(r.full_name)} — {String(r.unit_number ?? "")}</option>;
              })}
            </select>
          </label>
          <PetFormFields value={petForm} onChange={setPetForm} />
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
          <button
            disabled={!residentId || !petForm.pet_name || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />} Add Pet
          </button>
        </div>
      </div>
    </div>
  );
}

export function PetManagementPage() {
  const { queryParams, society, selectedSocietyId } = useScope();
  const qc = useQueryClient();
  const societyId = selectedSocietyId;
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("");
  const [ownerType, setOwnerType] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["pets", queryParams, search, species],
    queryFn: () => residentsApi.getPets({ ...queryParams, search: search || undefined, species: species || undefined }),
    enabled: !!societyId,
    retry: false,
  });

  const rows = normalizeList<Record<string, unknown>>(raw?.data ?? raw);

  const deleteMut = useMutation({
    mutationFn: (id: string) => residentsApi.deletePet(id),
    onSuccess: () => { toast.success("Pet deleted"); qc.invalidateQueries({ queryKey: ["pets"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Delete failed"),
  });

  const filteredRows = (rows ?? []).filter(r => {
    if (ownerType) {
      return mapResidentType(r.resident_type ?? r.owner_resident_type ?? "") === ownerType;
    }
    return true;
  });

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
        <Select className="w-40" value={ownerType} onChange={e => setOwnerType(e.target.value)}>
          <option value="">All Owner Types</option>
          <option value="OWNER">Owner</option>
          <option value="TENANT">Tenant</option>
        </Select>
        <Select className="w-40" value={species} onChange={e => setSpecies(e.target.value)}>
          <option value="">All Species</option>
          {["DOG","CAT","BIRD","FISH","RABBIT","OTHER"].map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {!isLoading && filteredRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <PawPrint size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">No pets registered</p>
          <p className="mt-1 text-sm text-gray-400">Click "Add Pet" to register a pet.</p>
        </div>
      ) : (
          <DataTable
          title="Pets"
          rows={filteredRows.map((r, i) => ({ ...r, __rowKey: r.id ?? i }))}
          isLoading={isLoading}
          columns={[
            { key: "pet_name", header: "PET NAME", render: (row: any) => (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <PawPrint size={14} />
                </div>
                <span className="font-medium">{String(row.pet_name ?? "-")}</span>
              </div>
            )},
            { key: "species", header: "SPECIES" },
            { key: "breed", header: "BREED" },
            { key: "owner_name", header: "OWNER", render: (row: any) => <span>{String(row.full_name ?? row.resident_name ?? "-")}</span> },
            { key: "block_name", header: "BLOCK" },
            { key: "unit_number", header: "UNIT" },
            { key: "vaccination_date", header: "VACCINATED" },
            { key: "actions", header: "", render: (row: any) => (
              <button
                onClick={() => deleteMut.mutate(String(row.id ?? ""))}
                disabled={deleteMut.isPending}
                className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete pet"
              >
                <Trash2 size={14} />
              </button>
            )},
          ]}
        />
      )}

      {addOpen && <AddPetModal societyId={society?.society_id ?? 1} onClose={() => setAddOpen(false)} />}
    </div>
  );
}
