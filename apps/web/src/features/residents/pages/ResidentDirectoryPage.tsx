
import { Button, DataTable, SearchBox, Select, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileDown, Loader2, MoreHorizontal, UserPlus, X, UserCheck, UserCog, PawPrint, Car, Check } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { residentsApi } from "@/api/residents.api";
import { residentsExtApi } from "@/app/api/client";
import { useScope } from "@/app/scope/ScopeProvider";
import { BulkActionBar } from "../../shared/components/BulkActionBar";
import { EditResidentModal } from "../components/EditResidentModal";

type ResidentForm = {
  full_name: string;
  email: string;
  mobile_primary: string;
  resident_type: "OWNER" | "TENANT";
  unit_id: string;
  move_in_date: string;
  move_out_date: string;
};

const EMPTY_FORM: ResidentForm = {
  full_name: "",
  email: "",
  mobile_primary: "",
  resident_type: "OWNER",
  unit_id: "",
  move_in_date: "",
  move_out_date: "",
};

const mapResidentType = (v: unknown) => {
  const s = String(v ?? "").toUpperCase();
  return s === "FAMILY" ? "OWNER" : s;
};

function AddResidentWizard({ societyId, onClose }: { societyId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [stepIndex, setStepIndex] = useState(0);

  type ResidentType = "OWNER" | "TENANT";
  const stepsOwner = ["Type","Owner Status","Unit","Details","Pets","Vehicles","Review"] as const;
  const stepsTenant = ["Type","Select Owner","Details","Lease","Pets","Vehicles","Review"] as const;

  const [residentType, setResidentType] = useState<ResidentType | null>(null);
  const [ownerStatus, setOwnerStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // personal details
  const [personal, setPersonal] = useState({ full_name: "", mobile_primary: "", email: "", move_in_date: "" });

  // unit / owner selection
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<Record<string, any> | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  // pets and vehicles
  const [pets, setPets] = useState<Array<any>>([]);
  const [vehicles, setVehicles] = useState<Array<any>>([]);

  // lease (for tenant)
  const [lease, setLease] = useState({ move_in_date: "", move_out_date: "", monthly_rent: "", security_deposit: "", lease_url: "" });

  // queries
  const { queryParams } = useScope();
  const unitsQuery = useQuery({ queryKey: ["units", societyId, "available_for_owner"], queryFn: () => residentsApi.getUnits({ society_id: societyId, available_for_owner: true, page: 1, page_size: 300 }), retry: false, enabled: !!societyId });
  const inactiveOwnersQuery = useQuery({ queryKey: ["inactive-owners", societyId, queryParams?.block_id], queryFn: () => residentsApi.getInactiveOwners({ society_id: societyId, block_id: queryParams?.block_id }), retry: false, enabled: !!societyId });

  const availableUnits = normalizeList<Record<string, any>>(unitsQuery.data && ((unitsQuery.data as any).data ?? unitsQuery.data)) ?? [];
  const _ownersResp: any = inactiveOwnersQuery.data;
  const inactiveOwners = (_ownersResp?.data ?? _ownersResp?.items ?? _ownersResp) ?? [];
  // debug logs removed

  const qcInvalidate = () => {
    qc.invalidateQueries({ queryKey: ["residents"] });
    qc.invalidateQueries({ queryKey: ["units"] });
    qc.invalidateQueries({ queryKey: ["blocks"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const validatePhone = (p: string) => /^\d{10}$/.test(p);
  const validateEmail = (e: string) => /^\S+@\S+\.\S+$/.test(e);

  const createResident = async () => {
    const payload: Record<string, any> = {
      society_id: societyId,
      full_name: personal.full_name.trim(),
      mobile_primary: personal.mobile_primary.trim(),
      email: personal.email?.trim() || null,
      resident_type: residentType,
      is_active: residentType === 'OWNER' ? (ownerStatus === 'ACTIVE') : true,
      move_in_date: personal.move_in_date || undefined,
    };
    if (selectedUnit) payload.unit_id = Number(selectedUnit);
    if (residentType === 'TENANT' && selectedOwner) payload.owner_resident_id = String(selectedOwner.id ?? selectedOwner.resident_id ?? selectedOwner.id);

    const res = await residentsApi.create(payload);
    const createdId = (res as any)?.data?.id ?? (res as any)?.data?.resident_id ?? (res as any)?.id ?? (res as any)?.resident_id;

    // attach pets
    if (createdId && pets.length) {
      for (const p of pets) {
        try { await residentsApi.addPet({ ...p, resident_id: createdId, society_id: societyId }); } catch {}
      }
    }

    // attach vehicles
    if (createdId && vehicles.length) {
      for (const v of vehicles) {
        try { await residentsApi.addVehicle({ ...v, resident_id: createdId, society_id: societyId }); } catch {}
      }
    }

    // create lease if tenant
    if (createdId && residentType === 'TENANT') {
      try {
        await residentsApi.createLease({ tenant_resident_id: createdId, move_in_date: lease.move_in_date || personal.move_in_date, move_out_date: lease.move_out_date || null, monthly_rent: lease.monthly_rent || null, security_deposit: lease.security_deposit || null, lease_url: lease.lease_url || null, society_id: societyId });
      } catch {}
    }

    qcInvalidate();
    toast.success(`${personal.full_name || 'Resident'} created`);
    onClose();
  };

  // step UI helpers
  const currentSteps = residentType === 'TENANT' ? stepsTenant : stepsOwner;
  const currentStepLabel = () => currentSteps[stepIndex] as string;

  const goNext = () => setStepIndex(i => Math.min(i + 1, (currentSteps.length - 1)));
  const goPrev = () => setStepIndex(i => Math.max(i - 1, 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white"><UserPlus size={18} /></div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Add Resident</h2>
              <p className="text-xs text-gray-500">{currentStepLabel()}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="p-6">
          {/* step indicator */}
          <div className="mb-4 flex items-center gap-3">
            {(residentType ? currentSteps : ["Type"]).map((s, idx) => {
              const completed = idx < stepIndex;
              const active = idx === stepIndex;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`h-8 w-8 flex items-center justify-center rounded-full ${completed ? 'bg-green-600 text-white' : active ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-500'}`}>
                    {completed ? <Check size={14} /> : idx + 1}
                  </div>
                  <div className={`text-xs ${active ? 'text-gray-900' : 'text-gray-400'}`}>{s}</div>
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <div>
            {/* TYPE SELECTION */}
            {stepIndex === 0 && (
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => { setResidentType('OWNER'); setStepIndex(1); }} className={`p-4 rounded-lg border hover:shadow ${residentType === 'OWNER' ? 'border-blue-600 shadow-md' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-50 p-2 text-blue-600"><UserCheck size={18} /></div>
                    <div>
                      <div className="font-medium">Owner</div>
                      <div className="text-xs text-gray-500">Owner of the unit</div>
                    </div>
                  </div>
                </button>

                <button type="button" onClick={() => { setResidentType('TENANT'); setStepIndex(1); }} className={`p-4 rounded-lg border hover:shadow ${residentType === 'TENANT' ? 'border-blue-600 shadow-md' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-50 p-2 text-blue-600"><UserCog size={18} /></div>
                    <div>
                      <div className="font-medium">Tenant</div>
                      <div className="text-xs text-gray-500">Assign tenant to an owner/unit</div>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* OWNER: Status */}
            {residentType === 'OWNER' && stepIndex === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => { setOwnerStatus('ACTIVE'); goNext(); }} className={`p-4 rounded-lg border ${ownerStatus === 'ACTIVE' ? 'border-blue-600 shadow-md' : 'border-gray-200'}`}>
                  <div className="font-medium">ACTIVE</div>
                  <div className="text-xs text-gray-500">Owner lives in the unit</div>
                </button>
                <button type="button" onClick={() => { setOwnerStatus('INACTIVE'); goNext(); }} className={`p-4 rounded-lg border ${ownerStatus === 'INACTIVE' ? 'border-blue-600 shadow-md' : 'border-gray-200'}`}>
                  <div className="font-medium">INACTIVE</div>
                  <div className="text-xs text-gray-500">Owner owns the unit but lives elsewhere</div>
                </button>
              </div>
            )}

            {/* OWNER: Unit selection */}
            {residentType === 'OWNER' && stepIndex === 2 && (
              <div>
                {unitsQuery.isLoading ? <div className="text-sm text-gray-500">Loading units…</div> : (
                  <label>
                    <span className="text-sm font-medium text-gray-700">Unit</span>
                    <select value={selectedUnit ?? ""} onChange={e=>setSelectedUnit(e.target.value || null)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                      <option value="">Select unit</option>
                      {availableUnits.map(u => (
                        <option key={String(u.unit_id ?? u.id)} value={String(u.unit_id ?? u.id)} disabled={Boolean(u.is_available === false)}>
                          {String(u.block_name ?? '-') + ' — ' + String(u.unit_number ?? u.unit_id ?? '-')}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}

            {/* TENANT: Select owner */}
            {residentType === 'TENANT' && stepIndex === 1 && (
              <div>
                {inactiveOwnersQuery.isLoading ? <div className="text-sm text-gray-500">Loading owners…</div> : (
                  <label>
                    <span className="text-sm font-medium text-gray-700">Select Owner</span>
                    <select value={String(selectedOwner?.id ?? '')} onChange={e => {
                      const found = inactiveOwners.find((o: any) => String(o.id ?? o.resident_id) === e.target.value);
                      setSelectedOwner(found ?? null);
                      if (found) {
                        setSelectedUnit(String(found.unit_id ?? found.unitId ?? ''));
                        setSelectedBlock(String(found.block_id ?? found.blockId ?? ''));
                      }
                      goNext();
                    }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                      <option value="">Select owner</option>
                            {inactiveOwners.length === 0 ? null : inactiveOwners.map((o: any) => (
                              <option key={String(o.id ?? o.resident_id)} value={String(o.id ?? o.resident_id)}>
                                {`${String(o.unit_number ?? o.unit_no ?? '-') } — ${String(o.full_name ?? o.name ?? '-')}`}
                              </option>
                            ))}
                    </select>
                  </label>
                )}
              </div>
            )}

            {/* Personal details for both */}
            {(stepIndex === 3 && residentType === 'OWNER') || (stepIndex === 2 && residentType === 'TENANT') ? (
              <div className="space-y-3">
                <label>
                  <span className="text-sm font-medium text-gray-700">Full Name</span>
                  <input value={personal.full_name} onChange={e=>setPersonal(p=>({...p, full_name: e.target.value}))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <span className="text-sm font-medium text-gray-700">Phone</span>
                    <input value={personal.mobile_primary} onChange={e=>setPersonal(p=>({...p, mobile_primary: e.target.value}))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    {!validatePhone(personal.mobile_primary) && personal.mobile_primary.length > 0 && <div className="text-xs text-red-600">Phone must be 10 digits</div>}
                  </label>
                  <label>
                    <span className="text-sm font-medium text-gray-700">Email</span>
                    <input value={personal.email} onChange={e=>setPersonal(p=>({...p, email: e.target.value}))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    {personal.email && !validateEmail(personal.email) && <div className="text-xs text-red-600">Invalid email</div>}
                  </label>
                </div>
                <label>
                  <span className="text-sm font-medium text-gray-700">Move-in Date</span>
                  <input type="date" value={personal.move_in_date} onChange={e=>setPersonal(p=>({...p, move_in_date: e.target.value}))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </label>
              </div>
            ) : null}

            {/* Lease for tenant */}
            {residentType === 'TENANT' && stepIndex === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <span className="text-sm font-medium text-gray-700">Move-in</span>
                    <input type="date" value={lease.move_in_date} onChange={e=>setLease(l=>({...l, move_in_date: e.target.value}))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                  </label>
                  <label>
                    <span className="text-sm font-medium text-gray-700">Move-out</span>
                    <input type="date" value={lease.move_out_date} onChange={e=>setLease(l=>({...l, move_out_date: e.target.value}))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                  </label>
                </div>
                {lease.move_in_date && lease.move_out_date && new Date(lease.move_out_date) <= new Date(lease.move_in_date) && (
                  <div className="rounded-md bg-yellow-50 p-2 text-sm text-yellow-800">Lease end must be after start</div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <span className="text-sm font-medium text-gray-700">Monthly Rent</span>
                    <input value={lease.monthly_rent} onChange={e=>setLease(l=>({...l, monthly_rent: e.target.value}))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                  </label>
                  <label>
                    <span className="text-sm font-medium text-gray-700">Security Deposit</span>
                    <input value={lease.security_deposit} onChange={e=>setLease(l=>({...l, security_deposit: e.target.value}))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                  </label>
                </div>
                <label>
                  <span className="text-sm font-medium text-gray-700">Lease URL</span>
                  <input value={lease.lease_url} onChange={e=>setLease(l=>({...l, lease_url: e.target.value}))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </label>
              </div>
            )}

            {/* Pets step (dynamic rows) */}
            {((residentType === 'OWNER' && stepIndex === 4 && ownerStatus === 'ACTIVE') || (residentType === 'TENANT' && stepIndex === 4)) && (
              <div>
                <div className="space-y-2">
                  {pets.length === 0 && <div className="text-sm text-gray-500">No pets added</div>}
                  {pets.map((p, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                      <input value={p.name} onChange={e=>{const arr=[...pets];arr[idx].name=e.target.value;setPets(arr);}} placeholder="Pet name" className="rounded-lg border border-gray-200 px-2 py-1 text-sm" />
                      <select value={p.species} onChange={e=>{const arr=[...pets];arr[idx].species=e.target.value;setPets(arr);}} className="rounded-lg border border-gray-200 px-2 py-1 text-sm">
                        <option value="DOG">Dog</option>
                        <option value="CAT">Cat</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <input value={p.breed} onChange={e=>{const arr=[...pets];arr[idx].breed=e.target.value;setPets(arr);}} placeholder="Breed" className="rounded-lg border border-gray-200 px-2 py-1 text-sm" />
                      <div className="flex gap-2"><input value={p.age} onChange={e=>{const arr=[...pets];arr[idx].age=e.target.value;setPets(arr);}} placeholder="Age" className="rounded-lg border border-gray-200 px-2 py-1 text-sm" /><button type="button" onClick={()=>setPets(ps=>ps.filter((_,i)=>i!==idx))} className="text-red-600">Remove</button></div>
                    </div>
                  ))}
                </div>
                <div className="mt-3"><button type="button" onClick={() => setPets(ps => [...ps, { name: '', species: 'DOG', breed: '', age: '' }])} className="rounded-lg bg-blue-600 px-3 py-2 text-white text-sm">Add Pet</button></div>
              </div>
            )}

            {/* Vehicles step (dynamic rows) */}
            {((residentType === 'OWNER' && stepIndex === 5 && ownerStatus === 'ACTIVE') || (residentType === 'TENANT' && stepIndex === 5)) && (
              <div>
                {vehicles.length === 0 && <div className="text-sm text-gray-500">No vehicles added</div>}
                {vehicles.map((v, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 items-end">
                    <select value={v.vehicle_type} onChange={e=>{const arr=[...vehicles];arr[idx].vehicle_type=e.target.value;setVehicles(arr);}} className="rounded-lg border border-gray-200 px-2 py-1 text-sm">
                      <option value="CAR">CAR</option>
                      <option value="BIKE">BIKE</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                    <input value={v.make} onChange={e=>{const arr=[...vehicles];arr[idx].make=e.target.value;setVehicles(arr);}} placeholder="Make" className="rounded-lg border border-gray-200 px-2 py-1 text-sm" />
                    <input value={v.model} onChange={e=>{const arr=[...vehicles];arr[idx].model=e.target.value;setVehicles(arr);}} placeholder="Model" className="rounded-lg border border-gray-200 px-2 py-1 text-sm" />
                    <input value={v.registration_no} onChange={e=>{const arr=[...vehicles];arr[idx].registration_no=e.target.value;setVehicles(arr);}} placeholder="Reg no" className="rounded-lg border border-gray-200 px-2 py-1 text-sm" />
                    <input value={v.parking_slot || ''} readOnly placeholder="Parking slot (select in unit)" className="rounded-lg border border-gray-200 px-2 py-1 text-sm bg-gray-50" />
                  </div>
                ))}
                <div className="mt-3"><button type="button" onClick={() => setVehicles(vs => [...vs, { vehicle_type: 'CAR', make: '', model: '', registration_no: '', parking_slot: null }])} className="rounded-lg bg-blue-600 px-3 py-2 text-white text-sm">Add Vehicle</button></div>
              </div>
            )}

            {/* REVIEW */}
            {((residentType === 'OWNER' && stepIndex === 6) || (residentType === 'TENANT' && stepIndex === 6)) && (
              <div className="space-y-3">
                <div className="rounded-lg border p-3">
                  <div className="font-medium">Resident</div>
                  <div className="text-sm">{personal.full_name} — {personal.mobile_primary}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="font-medium">Unit</div>
                  <div className="text-sm">{availableUnits.find(u=>String(u.unit_id??u.id)===String(selectedUnit)) ? (String(availableUnits.find(u=>String(u.unit_id??u.id)===String(selectedUnit))?.block_name ?? '-') + ' — ' + String(availableUnits.find(u=>String(u.unit_id??u.id)===String(selectedUnit))?.unit_number ?? '-')) : '—'}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="font-medium">Pets</div>
                  <div className="text-sm">{pets.length ? pets.map(p=>p.name).join(', ') : '—'}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="font-medium">Vehicles</div>
                  <div className="text-sm">{vehicles.length ? vehicles.map(v=>v.registration_no).join(', ') : '—'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <div>
            <button type="button" className="text-sm text-gray-500" onClick={() => { if (stepIndex > 0) goPrev(); else onClose(); }}>Back</button>
          </div>
          <div className="flex items-center gap-3">
            {((residentType === 'OWNER' && stepIndex === 6) || (residentType === 'TENANT' && stepIndex === 6)) ? (
              <button type="button" onClick={() => createResident()} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white">{residentType === 'OWNER' ? 'Save Owner' : 'Save Tenant'}</button>
            ) : (
              <button type="button" disabled={(residentType === 'OWNER' && stepIndex === 2 && !selectedUnit) || (residentType === 'TENANT' && stepIndex === 1 && !selectedOwner)} onClick={() => goNext()} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white">Next</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RowActions({row,onRefresh,onEdit,}: {row: Record<string, unknown>;onRefresh: () => void;onEdit: (row: Record<string, unknown>) => void;}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = String(row.id ?? "");
  const { society } = useScope();

  const moveOut = useMutation({
    mutationFn: () => residentsApi.moveOut(id, {}),
    onSuccess: () => { toast.success("Resident moved out"); onRefresh(); setOpen(false); },
    onError: (e: any) => toast.error((e as any)?.response?.data?.message ?? (e as Error)?.message ?? 'Operation failed'),
  });

  const deactivate = useMutation({
    mutationFn: () => residentsApi.update(id, { is_active: false }),
    onSuccess: () => { toast.success("Resident deactivated"); onRefresh(); setOpen(false); },
    onError: (e: any) => toast.error((e as any)?.response?.data?.message ?? (e as Error)?.message ?? 'Operation failed'),
  });

  const endLease = useMutation({
    mutationFn: async () => {
      // fetch active leases for this resident as tenant
      const leasesResp = await residentsApi.getLeases({ society_id: society?.society_id, page: 1, page_size: 200 });
      const leases = normalizeList<Record<string, unknown>>(leasesResp?.data ?? leasesResp) ?? [];
      const lease = leases.find(l => String(l.tenant_resident_id) === id && String(l.status) === 'ACTIVE');
      if (!lease) throw new Error('No active lease found');
      const leaseId = String(lease.id ?? lease.lease_id ?? '');
      const today = new Date().toISOString().slice(0,10);
      return residentsApi.endLeaseAndMoveOut(id, leaseId, today);
    },
    onSuccess: () => { toast.success('Lease ended and resident moved out'); onRefresh(); setOpen(false); },
    onError: (e: any) => toast.error((e as any)?.response?.data?.message ?? (e as Error)?.message ?? 'Operation failed'),
  });

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="rounded p-1 hover:bg-gray-100" onClick={() => setOpen(v => !v)} title="Actions">
        <MoreHorizontal size={16} className="text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-30 w-40 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
          <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { onEdit(row); setOpen(false); }}>Edit</button>
          <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50" onClick={() => moveOut.mutate()} disabled={moveOut.isPending}>
            {moveOut.isPending ? "Processing…" : "Move Out"}
          </button>
          <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50" onClick={() => endLease.mutate()} disabled={endLease.isPending}>
            {endLease.isPending ? 'Processing…' : 'End Lease'}
          </button>
          <button type="button" className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50" onClick={() => deactivate.mutate()} disabled={deactivate.isPending}>
            {deactivate.isPending ? "Processing…" : "Deactivate"}
          </button>
        </div>
      )}
    </div>
  );
}

export function ResidentDirectoryPage() {
  const { queryParams, society } = useScope();

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await residentsApi.exportCsv(society?.society_id);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelectedIds(prev =>
      prev.length === rows.length
        ? []
        : rows.map((r, i) =>
            String(`${r.id ?? r.resident_id ?? "resident"}-${i}`)
          )
    );

  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: ["residents", queryParams, search, type, status],

    queryFn: () =>
      residentsApi.getAll({
        ...queryParams,
        page: 1,
        page_size: 100,
        search: search || undefined,
        resident_type: type || undefined,
        is_active: status === 'active' ? true : status === 'inactive' ? false : undefined,
      }),

    retry: false,
  });

  const rows = (() => {
    const fetched = normalizeList<Record<string, unknown>>(
      raw?.data ?? raw
    );
    let list = fetched ?? [];

    // Remove expired & moved-out residents that are inactive
    const today = new Date().toISOString().slice(0, 10);
    list = list.filter(r => {
      if (!r) return false;
      const isActive = Boolean(r.is_active);
      const moveOut = r.move_out_date ? String(r.move_out_date).slice(0,10) : null;
      if (!isActive && moveOut && moveOut < today) return false;
      return true;
    });

    return list;
  })();

  const leasesQuery = useQuery({
    queryKey: ["leases", queryParams],
    queryFn: () => residentsApi.getLeases({ ...queryParams, page: 1, page_size: 500 }),
    retry: false,
  });

  const leasesList = normalizeList<Record<string, unknown>>(leasesQuery.data?.data ?? leasesQuery.data) ?? [];

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-sm text-gray-500">
            Residents / Resident Directory
          </p>

          <h1 className="text-2xl font-bold text-gray-900">
            Resident Directory
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {rows.length} residents registered
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 size={15} className="mr-1 animate-spin" /> : <FileDown size={15} className="mr-1" />}
            Export CSV
          </Button>

          <Button onClick={() => setAddOpen(true)}>
            <UserPlus size={15} className="mr-1" />
            Add Resident
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">

        <SearchBox
          className="min-w-[280px] flex-1"
          placeholder="Search by name, unit, mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select
          className="w-44"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="OWNER">Owner</option>
          <option value="TENANT">Tenant</option>
        </Select>

        <Select
          className="w-44"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked={rows.length > 0 && selectedIds.length === rows.length}
          onChange={toggleAll}
          className="h-4 w-4 rounded border-gray-300"
          title="Select all"
        />
        {selectedIds.length > 0 && (
          <span className="text-xs text-gray-500">{selectedIds.length} selected</span>
        )}
      </div>

      <DataTable
        title="Residents"
        rows={rows.map((row, index) => ({
          ...row,
          __rowKey: `${row.id ?? row.resident_id ?? row.email ?? "resident"}-${index}`,
        }))}
        isLoading={isLoading}
        columns={[
          {
            key: "__select" as never,
            header: "",
            render: (row: any) => {
              const id = String(row.__rowKey ?? row.id ?? row.resident_id ?? "");
              return (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(id)}
                  onChange={() => toggleSelect(id)}
                  className="h-4 w-4 rounded border-gray-300"
                  onClick={e => e.stopPropagation()}
                />
              );
            }
          },
          {
            key: "full_name",
            header: "NAME",

            render: (row: any) => (
              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {String(row.full_name ?? "?")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div>
                  <p className="font-medium text-gray-900">
                    {String(row.full_name ?? "-")}
                  </p>

                  <p className="text-xs text-gray-500">
                    {String(row.email ?? "")}
                  </p>
                </div>
              </div>
            ),
          },

          {
            key: "unit_number",
            header: "UNIT",
          },

          {
            key: "block_name",
            header: "BLOCK",
          },

          {
            key: "resident_type",
            header: "TYPE",
            render: (row: any) => (
              <StatusBadge value={String(mapResidentType(row.resident_type ?? ""))} />
            ),
          },

          {
            key: "is_active",
            header: "STATUS",
            render: (row: any) => (
              <StatusBadge
                value={row.is_active ? "ACTIVE" : "INACTIVE"}
              />
            ),
          },

          {
            key: "mobile_primary",
            header: "MOBILE",
          },

          {
            key: "move_in_date",
            header: "MOVE-IN",
          },
          {
            key: "days_remaining",
            header: "DAYS REMAINING",
            render: (row: any) => {
              const lease = leasesList.find(l => String(l.tenant_resident_id) === String(row.id ?? row.resident_id) && String(l.status) === 'ACTIVE');
              if (!lease) return <span>-</span>;
              const leaseEnd = lease.lease_end || lease.end || lease.leaseEnd;
              if (!leaseEnd) return <span>-</span>;
              const days = Math.ceil((new Date(String(leaseEnd)).getTime() - new Date().getTime()) / 86400000);
              return <span>{days >= 0 ? `${days} days` : 'Expired'}</span>;
            }
          },
          {
            key: "member_count",
            header: "MEMBERS",
            render: (row: any) => <span>{String(row.member_count ?? 1)}</span>,
          },
          {
            key: "__actions" as never,
            header: "",
            render: (row: any) => ( <RowActions row={row} onRefresh={() => refetch()} onEdit={(resident) => { setEditingResident(resident); setEditOpen(true); }} /> ),
          },
        ]}
      />

      {addOpen && (
        <AddResidentWizard
          societyId={society?.society_id ?? 1}
          onClose={() => setAddOpen(false)}
        />
      )}
      {editOpen && editingResident && (
        <EditResidentModal
          resident={editingResident}
          onClose={() => {
            setEditOpen(false);
            setEditingResident(null);
          }}
        />
      )}

      <BulkActionBar
        selectedIds={selectedIds}
        entityLabel="resident"
        onClearSelection={() => setSelectedIds([])}
        actions={[
          {
            label: "Export Selected",
            onClick: async () => {
              toast.info(`Exporting ${selectedIds.length} residents`);
              await residentsApi.exportCsv(society?.society_id);
            }
          }
        ]}
      />
    </div>
  );
}

