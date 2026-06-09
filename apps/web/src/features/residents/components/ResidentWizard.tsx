import React, { useMemo, useState } from "react";
import { Button, Card, Input, Select } from "@ams/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck, UserCog, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { residentsApi } from "@/api/residents.api";
import { useDynamicBlocks } from "@/hooks/useDynamicBlocks";
import { useDynamicUnits } from "@/hooks/useDynamicUnits";
import { useFilterReset } from "@/hooks/useFilterReset";
import { useScopedInvalidate } from "@/hooks/useScopedInvalidate";
import { QK } from "@/lib/queryKeys";

type WizardMode = "OWNER" | "TENANT";

export default function ResidentWizard({ societyId, onClose }: { societyId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { invalidateAfterResidentChange } = useScopedInvalidate();

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<WizardMode | null>(null);

  // Owner-specific
  const [ownerStatus, setOwnerStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [wizardBlockId, setWizardBlockId] = useState<number | undefined>();
  const [selectedUnit, setSelectedUnit] = useState<string>("");

  // Tenant-specific
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");

  // Shared personal details
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [moveInDate, setMoveInDate] = useState("");

  // Member count fields
  const [memberCount, setMemberCount] = useState<number>(1);
  const [adultsCount, setAdultsCount] = useState<number>(1);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [occupancyCategory, setOccupancyCategory] = useState<"FAMILY" | "BACHELOR" | "OWNER_OCCUPIED" | "TENANT_OCCUPIED">("FAMILY");

  // Lease (tenant)
  const [moveOutDate, setMoveOutDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [leaseUrl, setLeaseUrl] = useState("");

  // Pets & vehicles
  const [pets, setPets] = useState<Array<{ name: string; type: string; breed?: string; age?: string }>>([]);
  const [vehicles, setVehicles] = useState<Array<{ type: string; make?: string; model?: string; registration_no?: string; parking_slot?: string }>>([]);

  // Block cascade for OWNER: clear selected unit when block changes
  useFilterReset(wizardBlockId, () => setSelectedUnit(""));

  // Fetch helpers
  const blocksQ = useDynamicBlocks(societyId);
  const blocks = blocksQ.data ?? [];

  const unitsQ = useDynamicUnits(societyId, wizardBlockId);
  const units = unitsQ.data ?? [];

  const inactiveOwnersQ = useQuery({
    queryKey: QK.inactiveOwners(societyId),
    queryFn: () => residentsApi.getInactiveOwners({ society_id: societyId }),
    enabled: mode === "TENANT",
    staleTime: 30_000,
  });
  const inactiveOwners: any[] = (inactiveOwnersQ.data as any)?.data ?? [];

  // Parking slots per unit - cached map
  const [parkingOptions, setParkingOptions] = useState<Record<string, string[]>>({});
  const fetchParkingForUnit = async (unitId: string) => {
    const id = Number(unitId);
    if (!id) return [] as string[];
    if (parkingOptions[unitId]) return parkingOptions[unitId];
    try {
      const res = await residentsApi.getParkingSlots(id, societyId);
      const data = (res && (res as any).data) ?? res;
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

  // Validation
  const isPhoneValid = (p: string) => /^[0-9]{10}$/.test(p.trim());
  const isEmailValid = (e: string) => !e || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim());
  const isMemberCountValid = memberCount >= 1 && adultsCount >= 0 && childrenCount >= 0 && (adultsCount + childrenCount) <= memberCount;

  const canAdvance = useMemo(() => {
    if (!mode) return false;
    if (step === 1) return Boolean(mode);
    if (mode === "OWNER") {
      if (step === 2) return Boolean(ownerStatus);
      if (step === 3) return Boolean(selectedUnit);
      if (step === 4) return Boolean(fullName.trim()) && isPhoneValid(phone) && isEmailValid(email) && isMemberCountValid;
      if (step === 5) return true;
      if (step === 6) return true;
    }
    if (mode === "TENANT") {
      if (step === 2) return Boolean(selectedOwnerId);
      if (step === 3) return Boolean(fullName.trim()) && isPhoneValid(phone) && isEmailValid(email) && isMemberCountValid;
      if (step === 4) return Boolean(moveInDate) && (!moveOutDate || new Date(moveOutDate) > new Date(moveInDate));
      if (step === 5) return true;
      if (step === 6) return true;
    }
    return true;
  }, [mode, step, ownerStatus, selectedUnit, fullName, phone, email, selectedOwnerId, moveInDate, moveOutDate, isMemberCountValid]);

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
          member_count: memberCount,
          adults_count: adultsCount,
          children_count: childrenCount,
          occupancy_category: occupancyCategory,
        };
        const res = await residentsApi.create(payload);
        const newResident = (res && (res as any).data) ?? res;
        const residentId = String(newResident?.id ?? newResident?.resident_id ?? "");
        for (const p of pets) {
          await residentsApi.addPet({ resident_id: residentId, pet_name: p.name, species: p.type, breed: p.breed || null, age: p.age || null, society_id: societyId });
        }
        for (const v of vehicles) {
          await residentsApi.addVehicle({ resident_id: residentId, vehicle_type: v.type, make: v.make, model: v.model, registration_no: v.registration_no, parking_slot: v.parking_slot, society_id: societyId });
        }
        return residentId;
      }
      // TENANT
      const ownerRecord = inactiveOwners.find((o: any) => String(o.resident_id) === selectedOwnerId) as any;
      const payload: any = {
        society_id: societyId,
        unit_id: Number(ownerRecord?.unit_id) || undefined,
        owner_resident_id: selectedOwnerId || undefined,
        full_name: fullName.trim(),
        mobile_primary: phone.trim(),
        email: email.trim() || null,
        resident_type: "TENANT",
        move_in_date: moveInDate || null,
        move_out_date: moveOutDate || null,
        is_active: true,
        member_count: memberCount,
        adults_count: adultsCount,
        children_count: childrenCount,
        occupancy_category: occupancyCategory,
      };
      const res = await residentsApi.create(payload);
      const newResident = (res && (res as any).data) ?? res;
      const residentId = String(newResident?.id ?? newResident?.resident_id ?? "");
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
    },
    onSuccess: () => {
      toast.success(`${mode === "OWNER" ? "Owner" : "Tenant"} saved`);
      invalidateAfterResidentChange(societyId, wizardBlockId);
      qc.invalidateQueries({ queryKey: QK.inactiveOwners(societyId) });
      onClose();
    },
    onError: (e: any) => toast.error((e as any)?.response?.data?.message ?? (e as Error)?.message ?? "Save failed"),
  });

  const totalSteps = mode === "OWNER" ? 7 : mode === "TENANT" ? 7 : 1;

  const tenantOwnerUnit = useMemo(() => {
    if (mode !== "TENANT" || !selectedOwnerId) return "";
    const o = inactiveOwners.find((x: any) => String(x.resident_id) === selectedOwnerId);
    return o ? `${o.block_name ? o.block_name + " — " : ""}${o.unit_number ?? "No Unit"}` : "";
  }, [mode, selectedOwnerId, inactiveOwners]);

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
              <p className="text-xs text-gray-500">Step {step} of {totalSteps}</p>
            </div>
          </div>
          <button onClick={() => onClose()} className="rounded-lg p-1.5 hover:bg-gray-100">Close</button>
        </div>

        <div className="p-6">
          {/* Step indicator */}
          <div className="mb-4 flex items-center gap-2 overflow-x-auto">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const n = i + 1;
              const s = n < step ? "done" : n === step ? "current" : "future";
              return (
                <div key={n} className="flex items-center gap-2">
                  <div className={`h-8 w-8 flex items-center justify-center rounded-full text-sm ${s === "current" ? "bg-blue-600 text-white" : s === "done" ? "bg-green-500 text-white" : "border border-gray-300 text-gray-500"}`}>
                    {s === "done" ? <Check size={14} /> : n}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step 1: Choose mode */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <Card className={`p-4 cursor-pointer hover:shadow-md ${mode === "OWNER" ? "border-blue-600" : ""}`} onClick={() => { setMode("OWNER"); setStep(2); }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center text-blue-600"><UserCheck /></div>
                  <div>
                    <div className="font-medium">Owner</div>
                    <div className="text-xs text-gray-500">Add an owner who owns the unit</div>
                  </div>
                </div>
              </Card>
              <Card className={`p-4 cursor-pointer hover:shadow-md ${mode === "TENANT" ? "border-blue-600" : ""}`} onClick={() => { setMode("TENANT"); setStep(2); }}>
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

          {/* OWNER Step 2: Status */}
          {mode === "OWNER" && step === 2 && (
            <div>
              <div className="mb-3 font-medium">Owner Status</div>
              <div className="flex gap-3">
                <Card className={`p-4 cursor-pointer ${ownerStatus === "ACTIVE" ? "border-blue-600" : ""}`} onClick={() => setOwnerStatus("ACTIVE")}>
                  <div className="font-medium">ACTIVE</div>
                  <div className="text-xs text-gray-500">Owner lives in the unit</div>
                </Card>
                <Card className={`p-4 cursor-pointer ${ownerStatus === "INACTIVE" ? "border-blue-600" : ""}`} onClick={() => setOwnerStatus("INACTIVE")}>
                  <div className="font-medium">INACTIVE</div>
                  <div className="text-xs text-gray-500">Owner owns the unit but lives elsewhere</div>
                </Card>
              </div>
            </div>
          )}

          {/* OWNER Step 3: Block → Unit */}
          {mode === "OWNER" && step === 3 && (
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-sm font-medium text-gray-700">Select Block (optional — filters units)</div>
                <Select value={wizardBlockId ? String(wizardBlockId) : ""} onChange={e => setWizardBlockId(e.target.value ? Number(e.target.value) : undefined)}>
                  <option value="">All Blocks</option>
                  {blocks.map((b: any) => (
                    <option key={String(b.block_id)} value={String(b.block_id)}>{b.block_name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <div className="mb-1 text-sm font-medium text-gray-700">Select Unit *</div>
                <Select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
                  <option value="">Select unit</option>
                  {units.map((u: any) => (
                    <option key={String(u.unit_id ?? u.id)} value={String(u.unit_id ?? u.id)}>
                      {`${String(u.block_name ?? "-")} — ${String(u.unit_number ?? "-")}`}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {/* TENANT Step 2: Select Owner */}
          {mode === "TENANT" && step === 2 && (
            <div>
              <div className="mb-3 font-medium">Select Owner</div>
              <div className="mb-2 text-xs text-gray-500">Choose an inactive owner to assign as owner for this tenant</div>
              {inactiveOwners.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-600">
                  No inactive owners available
                </div>
              ) : (
                <Select value={selectedOwnerId} onChange={e => setSelectedOwnerId(e.target.value)}>
                  <option value="">Select owner</option>
                  {inactiveOwners.map((o: any) => {
                    const id = String(o.resident_id ?? "");
                    const label = `${o.block_name ? o.block_name + " — " : ""}${o.unit_number ?? "No Unit"} (${o.full_name})`;
                    return <option key={id} value={id}>{label}</option>;
                  })}
                </Select>
              )}
              {selectedOwnerId && tenantOwnerUnit && (
                <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  Unit: <span className="font-medium">{tenantOwnerUnit}</span>
                </div>
              )}
            </div>
          )}

          {/* Personal details — OWNER step 4 / TENANT step 3 */}
          {((mode === "OWNER" && step === 4) || (mode === "TENANT" && step === 3)) && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <Input value={fullName} onChange={(e: any) => setFullName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="10-digit mobile" />
                  {!isPhoneValid(phone) && phone.length > 0 && <div className="text-xs text-red-600">Phone must be 10 digits</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <Input value={email} onChange={(e: any) => setEmail(e.target.value)} />
                  {!isEmailValid(email) && email.length > 0 && <div className="text-xs text-red-600">Invalid email</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Move-in Date</label>
                  <Input type="date" value={moveInDate} onChange={(e: any) => setMoveInDate(e.target.value)} />
                </div>
              </div>

              {/* Member count */}
              <div className="rounded-lg border border-gray-100 p-3">
                <div className="mb-2 text-sm font-medium text-gray-700">Occupancy Details</div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Total Members *</label>
                    <Input type="number" min="1" value={memberCount} onChange={(e: any) => setMemberCount(Math.max(1, Number(e.target.value)))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Adults</label>
                    <Input type="number" min="0" value={adultsCount} onChange={(e: any) => setAdultsCount(Math.max(0, Number(e.target.value)))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Children</label>
                    <Input type="number" min="0" value={childrenCount} onChange={(e: any) => setChildrenCount(Math.max(0, Number(e.target.value)))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Category</label>
                    <Select value={occupancyCategory} onChange={(e: any) => setOccupancyCategory(e.target.value)}>
                      <option value="FAMILY">Family</option>
                      <option value="BACHELOR">Bachelor</option>
                      <option value="OWNER_OCCUPIED">Owner Occupied</option>
                      <option value="TENANT_OCCUPIED">Tenant Occupied</option>
                    </Select>
                  </div>
                </div>
                {!isMemberCountValid && <div className="mt-1 text-xs text-red-600">Adults + Children cannot exceed Total Members</div>}
              </div>
            </div>
          )}

          {/* TENANT Step 4: Lease details */}
          {mode === "TENANT" && step === 4 && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Move-in Date *</label>
                <Input type="date" value={moveInDate} onChange={(e: any) => setMoveInDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Move-out Date</label>
                <Input type="date" value={moveOutDate} onChange={(e: any) => setMoveOutDate(e.target.value)} />
                {moveInDate && moveOutDate && new Date(moveOutDate) <= new Date(moveInDate) && (
                  <div className="text-xs text-red-600">Move-out must be after move-in</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monthly Rent</label>
                  <Input value={monthlyRent} onChange={(e: any) => setMonthlyRent(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Security Deposit</label>
                  <Input value={securityDeposit} onChange={(e: any) => setSecurityDeposit(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lease URL</label>
                <Input value={leaseUrl} onChange={(e: any) => setLeaseUrl(e.target.value)} />
              </div>
            </div>
          )}

          {/* Pets step */}
          {mode && ((mode === "OWNER" && step === 5 && ownerStatus === "ACTIVE") || (mode === "TENANT" && step === 5)) && (
            <div>
              <div className="mb-2 font-medium">Pets</div>
              {pets.length === 0 && <div className="mb-2 text-sm text-gray-500">No pets added</div>}
              {pets.map((p, idx) => (
                <div key={idx} className="mb-2 flex items-center gap-2">
                  <div className="flex-1">
                    <Input value={p.name} placeholder="Pet name" onChange={(e: any) => setPets(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
                  </div>
                  <Select value={p.type} onChange={(e: any) => setPets(prev => prev.map((x, i) => i === idx ? { ...x, type: e.target.value } : x))}>
                    <option value="DOG">Dog</option>
                    <option value="CAT">Cat</option>
                    <option value="OTHER">Other</option>
                  </Select>
                  <button className="text-sm text-red-600" onClick={() => setPets(prev => prev.filter((_, i) => i !== idx))}>Remove</button>
                </div>
              ))}
              <button className="rounded bg-blue-600 px-3 py-1 text-sm text-white" onClick={() => setPets(prev => [...prev, { name: "", type: "DOG" }])}>Add Pet</button>
            </div>
          )}

          {/* Vehicles step */}
          {mode && ((mode === "OWNER" && step === 6 && ownerStatus === "ACTIVE") || (mode === "TENANT" && step === 6)) && (
            <div>
              <div className="mb-2 font-medium">Vehicles</div>
              {vehicles.length === 0 && <div className="mb-2 text-sm text-gray-500">No vehicles added</div>}
              {vehicles.map((v, idx) => (
                <div key={idx} className="mb-2 grid grid-cols-3 items-center gap-2">
                  <Select value={v.type} onChange={(e: any) => setVehicles(prev => prev.map((x, i) => i === idx ? { ...x, type: e.target.value } : x))}>
                    <option value="CAR">CAR</option>
                    <option value="BIKE">BIKE</option>
                    <option value="OTHER">OTHER</option>
                  </Select>
                  <Input value={v.registration_no} placeholder="Reg. no" onChange={(e: any) => setVehicles(prev => prev.map((x, i) => i === idx ? { ...x, registration_no: e.target.value } : x))} />
                  <Select
                    value={v.parking_slot || ""}
                    onChange={(e: any) => setVehicles(prev => prev.map((x, i) => i === idx ? { ...x, parking_slot: e.target.value } : x))}
                    onFocus={async () => { if (selectedUnit) await fetchParkingForUnit(selectedUnit); }}
                  >
                    <option value="">Select parking</option>
                    {(parkingOptions[selectedUnit] ?? []).map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                  <div className="col-span-3 text-right">
                    <button className="text-sm text-red-600" onClick={() => setVehicles(prev => prev.filter((_, i) => i !== idx))}>Remove</button>
                  </div>
                </div>
              ))}
              <button className="rounded bg-blue-600 px-3 py-1 text-sm text-white" onClick={() => setVehicles(prev => [...prev, { type: "CAR", registration_no: "", parking_slot: "" }])}>Add Vehicle</button>
            </div>
          )}

          {/* Review */}
          {mode && step === totalSteps && (
            <div>
              <div className="mb-3 font-medium">Review</div>
              <div className="mb-3 rounded border p-3">
                <div className="font-semibold">Resident</div>
                <div className="text-sm">{fullName} · {phone} · {email}</div>
                <div className="text-xs text-gray-500">Type: {mode}{mode === "OWNER" && ownerStatus ? ` · ${ownerStatus}` : ""}</div>
                <div className="text-xs text-gray-500">Members: {memberCount} ({adultsCount} adults, {childrenCount} children) · {occupancyCategory}</div>
              </div>
              <div className="mb-3 rounded border p-3">
                <div className="font-semibold">Unit</div>
                {mode === "OWNER" ? (
                  <div className="text-sm">
                    {units.find((u: any) => String(u.unit_id ?? u.id) === selectedUnit)?.block_name ?? "-"} —{" "}
                    {units.find((u: any) => String(u.unit_id ?? u.id) === selectedUnit)?.unit_number ?? "-"}
                  </div>
                ) : (
                  <div className="text-sm">{tenantOwnerUnit || "—"}</div>
                )}
              </div>
              <div className="mb-3 rounded border p-3">
                <div className="font-semibold">Pets</div>
                <div className="text-sm">{pets.length ? pets.map(p => p.name).join(", ") : "—"}</div>
              </div>
              <div className="mb-3 rounded border p-3">
                <div className="font-semibold">Vehicles</div>
                <div className="text-sm">{vehicles.length ? vehicles.map(v => v.registration_no).join(", ") : "—"}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <button type="button" className="text-sm text-gray-500" onClick={() => { if (step > 1) setStep(s => s - 1); else onClose(); }}>Back</button>
          <div className="flex items-center gap-3">
            {step < totalSteps ? (
              <Button disabled={!canAdvance} onClick={() => setStep(s => Math.min(totalSteps, s + 1))}>Next</Button>
            ) : (
              <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                {saveMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : `Save ${mode === "OWNER" ? "Owner" : "Tenant"}`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
