import React, { useMemo, useState } from "react";
import { Button, Card, Input, Select } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck, UserCog, Check, Dog, PawPrint, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

type WizardMode = "OWNER" | "TENANT";

export default function ResidentWizard({ societyId, onClose }: { societyId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { queryParams } = useScope();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<WizardMode | null>(null);

  // Owner-specific
  const [ownerStatus, setOwnerStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [selectedUnit, setSelectedUnit] = useState<string>("");

  // Tenant-specific
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");

  // Shared personal details
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [moveInDate, setMoveInDate] = useState("");

  // Lease (tenant)
  const [moveOutDate, setMoveOutDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [leaseUrl, setLeaseUrl] = useState("");

  // Pets & vehicles
  const [pets, setPets] = useState<Array<{ name: string; type: string; breed?: string; age?: string }>>([]);
  const [vehicles, setVehicles] = useState<Array<{ type: string; make?: string; model?: string; registration_no?: string; parking_slot?: string }>>([]);

  // Fetch helpers
  const unitsQ = useQuery({
    queryKey: ["units", societyId],
    queryFn: async () => {
      const res = await residentsApi.getUnits({ society_id: societyId, page: 1, page_size: 500 });
      return (res as any)?.data?.data ?? (res as any)?.data ?? [];
    },
    enabled: mode === "OWNER" || mode === null,
  });
  const units = normalizeList<any>(unitsQ.data ?? []) ?? [];

  const mapResidentType = (v: unknown) => {
    const s = String(v ?? "").toUpperCase();
    return s === "FAMILY" ? "OWNER" : s;
  };

  // Fetch inactive residents and defensively map response shapes
  const inactiveOwnersQ = useQuery({
    queryKey: ['inactive-owners', societyId],
    queryFn: () => residentsApi.getInactiveOwners({ society_id: societyId }),
    enabled: mode === 'TENANT',
    staleTime: 30_000,
  });

  // http returns AxiosResponse; .data = body { success, data: [...] }; .data.data = array
  const inactiveOwners: any[] = (inactiveOwnersQ.data as any)?.data?.data ?? [];

  // debug logs removed

  // Parking slots per unit - cached map
  const [parkingOptions, setParkingOptions] = useState<Record<string, string[]>>({});
  const fetchParkingForUnit = async (unitId: string) => {
    const id = Number(unitId);
    if (!id) return [] as string[];
    if (parkingOptions[unitId]) return parkingOptions[unitId];
    try {
      const res = await residentsApi.getParkingSlots(id, societyId);
      const data = (res && (res as any).data) ?? res;
      // try to derive slots array
      const slots = (data?.parking_slots as string[] | undefined) ?? (data?.parking_slots_list as string[] | undefined);
      if (Array.isArray(slots)) { setParkingOptions(s => ({ ...s, [unitId]: slots })); return slots; }
      const count = Number(data?.parking_slots_count ?? data?.parking_slots ?? 0);
      const calc = Array.from({ length: Math.max(0, count) }).map((_, i) => `P-${String(i + 1).padStart(2, "0")}`);
      setParkingOptions(s => ({ ...s, [unitId]: calc }));
      return calc;
    } catch {
      return [];
    }
  };

  // Validation helpers
  const isPhoneValid = (p: string) => /^[0-9]{10}$/.test(p.trim());
  const isEmailValid = (e: string) => !e || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim());

  const canAdvance = useMemo(() => {
    if (!mode) return false;
    if (step === 1) return Boolean(mode);
    if (mode === "OWNER") {
      if (step === 2) return Boolean(ownerStatus);
      if (step === 3) return Boolean(selectedUnit);
      if (step === 4) return fullName.trim() && isPhoneValid(phone) && isEmailValid(email);
      if (step === 5) return true; // pets free-form
      if (step === 6) return true; // vehicles optional
    }
    if (mode === "TENANT") {
      if (step === 2) return Boolean(selectedOwnerId);
      if (step === 3) return fullName.trim() && isPhoneValid(phone) && isEmailValid(email);
      if (step === 4) return Boolean(moveInDate) && (!moveOutDate || new Date(moveOutDate) > new Date(moveInDate));
      if (step === 5) return true;
      if (step === 6) return true;
    }
    return true;
  }, [mode, step, ownerStatus, selectedUnit, fullName, phone, email, selectedOwnerId, moveInDate, moveOutDate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!mode) throw new Error("No resident type selected");
      if (mode === "OWNER") {
        const payload: any = {
          society_id: societyId,
          unit_id: Number(selectedUnit) || undefined,
          full_name: fullName.trim(),
          mobile_primary: phone.trim(),
          email: email.trim() || null,
          resident_type: "OWNER",
          move_in_date: moveInDate || null,
          is_active: ownerStatus === "ACTIVE",
        };
        const res = await residentsApi.create(payload);
        const newResident = (res && (res as any).data) ?? res;
        const residentId = String(newResident?.id ?? newResident?.resident_id ?? "");
        // add pets
        for (const p of pets) {
          await residentsApi.addPet({ resident_id: residentId, pet_name: p.name, species: p.type, breed: p.breed || null, age: p.age || null, society_id: societyId });
        }
        // add vehicles
        for (const v of vehicles) {
          await residentsApi.addVehicle({ resident_id: residentId, vehicle_type: v.type, make: v.make, model: v.model, registration_no: v.registration_no, parking_slot: v.parking_slot, society_id: societyId });
        }
        return residentId;
      }
      // TENANT
      if (mode === "TENANT") {
        const payload: any = {
          society_id: societyId,
          owner_resident_id: selectedOwnerId || undefined,
          full_name: fullName.trim(),
          mobile_primary: phone.trim(),
          email: email.trim() || null,
          resident_type: "TENANT",
          move_in_date: moveInDate || null,
          move_out_date: moveOutDate || null,
          is_active: true,
        };
        const res = await residentsApi.create(payload);
        const newResident = (res && (res as any).data) ?? res;
        const residentId = String(newResident?.id ?? newResident?.resident_id ?? "");
        // create lease
        if (moveInDate) {
          await residentsApi.createLease({ resident_id: residentId, tenant_resident_id: residentId, owner_resident_id: selectedOwnerId || null, move_in_date: moveInDate, move_out_date: moveOutDate || null, monthly_rent: monthlyRent || null, security_deposit: securityDeposit || null, lease_url: leaseUrl || null, society_id: societyId });
        }
        for (const p of pets) {
          await residentsApi.addPet({ resident_id: residentId, pet_name: p.name, species: p.type, breed: p.breed || null, age: p.age || null, society_id: societyId });
        }
        for (const v of vehicles) {
          await residentsApi.addVehicle({ resident_id: residentId, vehicle_type: v.type, make: v.make, model: v.model, registration_no: v.registration_no, parking_slot: v.parking_slot, society_id: societyId });
        }
        return residentId;
      }
      return null;
    },
    onSuccess: (id) => {
      toast.success(`${mode === "OWNER" ? "Owner" : "Tenant"} saved`);
      qc.invalidateQueries({ queryKey: ["residents"] });
      qc.invalidateQueries({ queryKey: ["units"] });
      qc.invalidateQueries({ queryKey: ["blocks"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      onClose();
    },
    onError: (e: any) => toast.error((e as any)?.response?.data?.message ?? (e as Error)?.message ?? "Save failed"),
  });

  // Basic step indicator
  const totalSteps = mode === "OWNER" ? 7 : mode === "TENANT" ? 7 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[1000px] rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <UserCheck size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Add Resident</h2>
              <p className="text-xs text-gray-500">Enterprise wizard — step {step} of {totalSteps}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onClose()} className="rounded-lg p-1.5 hover:bg-gray-100">Close</button>
          </div>
        </div>

        <div className="p-6">
          {/* Step indicator */}
          <div className="mb-4 flex items-center gap-2 overflow-x-auto">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const n = i + 1;
              const status = n < step ? 'done' : n === step ? 'current' : 'future';
              return (
                <div key={n} className={`flex items-center gap-2`}> 
                  <div className={`h-8 w-8 flex items-center justify-center rounded-full ${status === 'current' ? 'bg-blue-600 text-white' : status === 'done' ? 'bg-green-500 text-white' : 'border border-gray-300 text-gray-500'}`}>
                    {status === 'done' ? <Check size={14} /> : n}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Steps */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <Card className={`p-4 cursor-pointer hover:shadow-md ${mode === 'OWNER' ? 'border-blue-600' : ''}`} onClick={() => { setMode('OWNER'); setStep(2); }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center text-blue-600"><UserCheck /></div>
                  <div>
                    <div className="font-medium">Owner</div>
                    <div className="text-xs text-gray-500">Add an owner who owns the unit</div>
                  </div>
                </div>
              </Card>

              <Card className={`p-4 cursor-pointer hover:shadow-md ${mode === 'TENANT' ? 'border-blue-600' : ''}`} onClick={() => { setMode('TENANT'); setStep(2); }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center text-blue-600"><UserCog /></div>
                  <div>
                    <div className="font-medium">Tenant</div>
                    <div className="text-xs text-gray-500">Add a tenant who rents a unit</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* OWNER FLOW */}
          {mode === 'OWNER' && step === 2 && (
            <div>
              <div className="mb-3 font-medium">Owner Status</div>
              <div className="flex gap-3">
                <Card className={`p-4 cursor-pointer ${ownerStatus === 'ACTIVE' ? 'border-blue-600' : ''}`} onClick={() => setOwnerStatus('ACTIVE')}>
                  <div className="font-medium">ACTIVE</div>
                  <div className="text-xs text-gray-500">Owner lives in the unit</div>
                </Card>
                <Card className={`p-4 cursor-pointer ${ownerStatus === 'INACTIVE' ? 'border-blue-600' : ''}`} onClick={() => setOwnerStatus('INACTIVE')}>
                  <div className="font-medium">INACTIVE</div>
                  <div className="text-xs text-gray-500">Owner owns the unit but lives elsewhere</div>
                </Card>
              </div>
            </div>
          )}

          {mode === 'OWNER' && step === 3 && (
            <div>
              <div className="mb-3 font-medium">Select Unit</div>
              <div className="mb-2 text-xs text-gray-500">Search and pick an available unit for owner</div>
              <Select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
                <option value="">Select unit</option>
                {units.map((u: any) => (
                  <option key={String(u.unit_id ?? u.id)} value={String(u.unit_id ?? u.id)} disabled={!u.is_available && !u.available_for_owner}>{`${String(u.block_name ?? '-') } — ${String(u.unit_number ?? '-')}`}</option>
                ))}
              </Select>
            </div>
          )}

          {((mode === 'OWNER' && step === 4) || (mode === 'TENANT' && step === 3)) && (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <Input value={fullName} onChange={(e:any) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <Input value={phone} onChange={(e:any) => setPhone(e.target.value)} placeholder="10-digit mobile" />
                {!isPhoneValid(phone) && phone.length > 0 && <div className="text-xs text-red-600">Phone must be 10 digits</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <Input value={email} onChange={(e:any) => setEmail(e.target.value)} />
                {!isEmailValid(email) && email.length > 0 && <div className="text-xs text-red-600">Invalid email</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Move-in Date</label>
                <Input type="date" value={moveInDate} onChange={(e:any) => setMoveInDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Tenant: select owner */}
          {mode === 'TENANT' && step === 2 && (
            <div>
              <div className="mb-3 font-medium">Select Owner</div>
              <div className="mb-2 text-xs text-gray-500">Choose an inactive owner to assign as owner for this tenant</div>
                  {inactiveOwners.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-600">
                      <div>No inactive owners available</div>
                    </div>
                  ) : (
                    <Select value={selectedOwnerId} onChange={e => {
                      const val = e.target.value;
                      setSelectedOwnerId(val);
                      const selected = inactiveOwners.find((o: any) => String(o.resident_id) === val);
                      if (selected) {
                        setSelectedOwnerId(String(selected.resident_id));
                        setSelectedUnit(String(selected.unit_id ?? ''));
                        setSelectedBlockId(String(selected.block_id ?? ''));
                      }
                    }}>
                      <option value="">Select owner</option>
                      {inactiveOwners.map((o: any) => {
                        const id = String(o.resident_id ?? '');
                        const label = `${o.block_name ? o.block_name + ' — ' : ''}${o.unit_number ?? 'No Unit'} (${o.full_name})`;
                        return <option key={id} value={id}>{label}</option>;
                      })}
                    </Select>
                  )}
            </div>
          )}

          {mode === 'TENANT' && step === 4 && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Move-in Date</label>
                <Input type="date" value={moveInDate} onChange={(e:any) => setMoveInDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Move-out Date</label>
                <Input type="date" value={moveOutDate} onChange={(e:any) => setMoveOutDate(e.target.value)} />
                {moveInDate && moveOutDate && new Date(moveOutDate) <= new Date(moveInDate) && <div className="text-xs text-red-600">Move-out must be after move-in</div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monthly Rent</label>
                  <Input value={monthlyRent} onChange={(e:any) => setMonthlyRent(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Security Deposit</label>
                  <Input value={securityDeposit} onChange={(e:any) => setSecurityDeposit(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lease URL</label>
                <Input value={leaseUrl} onChange={(e:any) => setLeaseUrl(e.target.value)} />
              </div>
            </div>
          )}

          {/* Pets step */}
          {(mode && ((mode === 'OWNER' && step === 5 && ownerStatus === 'ACTIVE') || (mode === 'TENANT' && step === 5))) && (
            <div>
              <div className="mb-2 font-medium">Pets</div>
              {pets.length === 0 && <div className="text-sm text-gray-500">No pets added</div>}
              {pets.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-2">
                  <div className="flex-1">
                    <Input value={p.name} placeholder="Pet name" onChange={(e:any) => setPets(prev => prev.map((x,i)=>i===idx?{...x,name:e.target.value}:x))} />
                  </div>
                  <Select value={p.type} onChange={(e:any) => setPets(prev => prev.map((x,i)=>i===idx?{...x,type:e.target.value}:x))}>
                    <option value="DOG">Dog</option>
                    <option value="CAT">Cat</option>
                    <option value="OTHER">Other</option>
                  </Select>
                  <button className="text-red-600" onClick={() => setPets(prev => prev.filter((_,i) => i !== idx))}>Remove</button>
                </div>
              ))}
              <div>
                <button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={() => setPets(prev => [...prev, { name: "", type: "DOG" }])}>Add Pet</button>
              </div>
            </div>
          )}

          {/* Vehicles step */}
          {(mode && ((mode === 'OWNER' && step === 6 && ownerStatus === 'ACTIVE') || (mode === 'TENANT' && step === 6))) && (
            <div>
              <div className="mb-2 font-medium">Vehicles</div>
              {vehicles.length === 0 && <div className="text-sm text-gray-500">No vehicles added</div>}
              {vehicles.map((v, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 items-center mb-2">
                  <Select value={v.type} onChange={(e:any) => setVehicles(prev => prev.map((x,i)=>i===idx?{...x,type:e.target.value}:x))}>
                    <option value="CAR">CAR</option>
                    <option value="BIKE">BIKE</option>
                    <option value="OTHER">OTHER</option>
                  </Select>
                  <Input value={v.registration_no} placeholder="Reg. no" onChange={(e:any) => setVehicles(prev => prev.map((x,i)=>i===idx?{...x,registration_no:e.target.value}:x))} />
                  <Select value={v.parking_slot || ""} onChange={(e:any) => setVehicles(prev => prev.map((x,i)=>i===idx?{...x,parking_slot:e.target.value}:x))} onFocus={async () => {
                    // fetch parking for selectedUnit or derive from first unit
                    const unitId = selectedUnit || (inactiveOwners.find(o=>String(o.id||o.resident_id)===selectedOwnerId)?.unit_id) || '';
                    if (unitId) await fetchParkingForUnit(String(unitId));
                  }}>
                    <option value="">Select parking</option>
                    {(parkingOptions[selectedUnit] ?? []).map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                  <div className="col-span-3 text-right">
                    <button className="text-red-600" onClick={() => setVehicles(prev => prev.filter((_,i) => i !== idx))}>Remove</button>
                  </div>
                </div>
              ))}
              <div>
                <button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={() => setVehicles(prev => [...prev, { type: 'CAR', registration_no: '', parking_slot: '' }])}>Add Vehicle</button>
              </div>
            </div>
          )}

          {/* Review */}
          {mode && step === totalSteps && (
            <div>
              <div className="mb-3 font-medium">Review</div>
              <div className="rounded border p-3 mb-3">
                <div className="font-semibold">Resident</div>
                <div className="text-sm">{fullName} · {phone} · {email}</div>
                <div className="text-xs text-gray-500">Type: {mode} {mode==='OWNER' && ownerStatus ? `· ${ownerStatus}` : ''}</div>
              </div>
              <div className="rounded border p-3 mb-3">
                <div className="font-semibold">Unit</div>
                <div className="text-sm">{units.find(u=>String(u.unit_id ?? u.id)===selectedUnit)?.block_name ?? '-' } — {units.find(u=>String(u.unit_id ?? u.id)===selectedUnit)?.unit_number ?? '-'}</div>
              </div>
              <div className="rounded border p-3 mb-3">
                <div className="font-semibold">Pets</div>
                <div className="text-sm">{pets.length ? pets.map(p=>p.name).join(', ') : '—'}</div>
              </div>
              <div className="rounded border p-3 mb-3">
                <div className="font-semibold">Vehicles</div>
                <div className="text-sm">{vehicles.length ? vehicles.map(v=>v.registration_no).join(', ') : '—'}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <div>
            <button type="button" className="text-sm text-gray-500" onClick={() => { if (step > 1) setStep(s => s - 1); else onClose(); }}>Back</button>
          </div>
          <div className="flex items-center gap-3">
            {step < totalSteps ? (
              <Button disabled={!canAdvance} onClick={() => setStep(s => Math.min(totalSteps, s + 1))}>Next</Button>
            ) : (
              <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : `Save ${mode === 'OWNER' ? 'Owner' : 'Tenant'}`}</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
