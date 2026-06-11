/**
 * Reusable vehicle form fields.
 * Used by AddVehicleModal (VehicleManagementPage) and ResidentWizard vehicle step.
 * Includes grouped-by-block AVAILABLE parking slot dropdown (lazy-loaded on focus).
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parkingApi, type ParkingSlot } from "@/api/parking.api";

export type VehicleFormData = {
  registration_no: string;
  vehicle_type: string;
  make: string;
  model: string;
  color: string;
  fuel_type: string;
  parking_slot: string;
  rfid_tag: string;
  sticker_number: string;
  notes: string;
};

export const EMPTY_VEHICLE: VehicleFormData = {
  registration_no: "",
  vehicle_type: "CAR",
  make: "",
  model: "",
  color: "",
  fuel_type: "",
  parking_slot: "",
  rfid_tag: "",
  sticker_number: "",
  notes: "",
};

const inp = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm";
const lbl = "mb-1 block text-sm font-medium text-gray-700";

interface Props {
  value: VehicleFormData;
  onChange: (v: VehicleFormData) => void;
  societyId: number;
}

export function VehicleFormFields({ value, onChange, societyId }: Props) {
  const set = (key: keyof VehicleFormData, val: string) =>
    onChange({ ...value, [key]: val });

  const [parkingEnabled, setParkingEnabled] = useState(false);
  const slotsQ = useQuery({
    queryKey: ["parking-slots-available", societyId],
    queryFn: () => parkingApi.getSlots({ society_id: societyId, parking_status: "AVAILABLE", page_size: 500 }),
    enabled: !!societyId && parkingEnabled,
    staleTime: 60_000,
  });

  const slots: ParkingSlot[] = slotsQ.data?.data ?? [];

  // Group by block name
  const byBlock = slots.reduce<Record<string, ParkingSlot[]>>((acc, s) => {
    const key = s.block_name ?? "Unassigned";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 block">
          <span className={lbl}>Registration No *</span>
          <input value={value.registration_no}
            onChange={e => set("registration_no", e.target.value.toUpperCase())}
            placeholder="KA-01-AB-1234"
            className={`${inp} font-mono uppercase`} />
        </label>

        <label className="block">
          <span className={lbl}>Type *</span>
          <select value={value.vehicle_type} onChange={e => set("vehicle_type", e.target.value)} className={inp}>
            {["CAR","BIKE","TRUCK","SCOOTER","OTHER"].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={lbl}>Fuel Type</span>
          <select value={value.fuel_type} onChange={e => set("fuel_type", e.target.value)} className={inp}>
            <option value="">Select fuel type</option>
            {["PETROL","DIESEL","CNG","ELECTRIC","HYBRID","OTHER"].map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={lbl}>Make</span>
          <input value={value.make} onChange={e => set("make", e.target.value)}
            placeholder="Maruti, Honda..." className={inp} />
        </label>
        <label className="block">
          <span className={lbl}>Model</span>
          <input value={value.model} onChange={e => set("model", e.target.value)}
            placeholder="Swift, City..." className={inp} />
        </label>

        <label className="block">
          <span className={lbl}>Color</span>
          <input value={value.color} onChange={e => set("color", e.target.value)}
            placeholder="White, Black..." className={inp} />
        </label>
        <label className="block">
          <span className={lbl}>Parking Slot</span>
          <select
            value={value.parking_slot}
            onChange={e => set("parking_slot", e.target.value)}
            onFocus={() => setParkingEnabled(true)}
            className={inp}
          >
            <option value="">No parking assigned</option>
            {slotsQ.isLoading && <option disabled>Loading slots...</option>}
            {Object.entries(byBlock).map(([blockName, blockSlots]) => (
              <optgroup key={blockName} label={`Block: ${blockName}`}>
                {blockSlots.map(s => (
                  <option key={s.id} value={s.slot_code}>
                    {s.slot_code} — {s.slot_type}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={lbl}>RFID Tag</span>
          <input value={value.rfid_tag} onChange={e => set("rfid_tag", e.target.value)}
            placeholder="RFID-001" className={inp} />
        </label>
        <label className="block">
          <span className={lbl}>Sticker No</span>
          <input value={value.sticker_number} onChange={e => set("sticker_number", e.target.value)}
            placeholder="STK-001" className={inp} />
        </label>
      </div>

      <label className="block">
        <span className={lbl}>Notes</span>
        <textarea value={value.notes} onChange={e => set("notes", e.target.value)}
          rows={2} placeholder="Additional notes..."
          className={`${inp} resize-none`} />
      </label>
    </div>
  );
}
