/**
 * Reusable pet form fields.
 * Used by AddPetModal (PetManagementPage) and ResidentWizard pet step.
 */

export type PetFormData = {
  pet_name: string;
  nickname: string;
  species: string;
  breed: string;
  color: string;
  gender: string;
  age_years: string;
  weight_kg: string;
  is_vaccinated: boolean;
  vaccination_date: string;
  medical_notes: string;
  is_aggressive: boolean;
  notes: string;
};

export const EMPTY_PET: PetFormData = {
  pet_name: "",
  nickname: "",
  species: "DOG",
  breed: "",
  color: "",
  gender: "",
  age_years: "",
  weight_kg: "",
  is_vaccinated: false,
  vaccination_date: "",
  medical_notes: "",
  is_aggressive: false,
  notes: "",
};

const inp = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm";
const lbl = "mb-1 block text-sm font-medium text-gray-700";

interface Props {
  value: PetFormData;
  onChange: (v: PetFormData) => void;
}

export function PetFormFields({ value, onChange }: Props) {
  const set = (key: keyof PetFormData, val: string | boolean) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={lbl}>Pet Name *</span>
          <input value={value.pet_name} onChange={e => set("pet_name", e.target.value)}
            placeholder="Buddy" className={inp} />
        </label>
        <label className="block">
          <span className={lbl}>Nickname</span>
          <input value={value.nickname} onChange={e => set("nickname", e.target.value)}
            placeholder="Bud" className={inp} />
        </label>

        <label className="block">
          <span className={lbl}>Species *</span>
          <select value={value.species} onChange={e => set("species", e.target.value)} className={inp}>
            {["DOG","CAT","BIRD","FISH","RABBIT","HAMSTER","TURTLE","SNAKE","OTHER"].map(s => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={lbl}>Breed</span>
          <input value={value.breed} onChange={e => set("breed", e.target.value)}
            placeholder="Labrador" className={inp} />
        </label>

        <label className="block">
          <span className={lbl}>Color</span>
          <input value={value.color} onChange={e => set("color", e.target.value)}
            placeholder="Golden, Black..." className={inp} />
        </label>
        <label className="block">
          <span className={lbl}>Gender</span>
          <select value={value.gender} onChange={e => set("gender", e.target.value)} className={inp}>
            <option value="">Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </label>

        <label className="block">
          <span className={lbl}>Age (years)</span>
          <input type="number" min="0" step="0.5" value={value.age_years}
            onChange={e => set("age_years", e.target.value)}
            placeholder="2" className={inp} />
        </label>
        <label className="block">
          <span className={lbl}>Weight (kg)</span>
          <input type="number" min="0" step="0.1" value={value.weight_kg}
            onChange={e => set("weight_kg", e.target.value)}
            placeholder="12.5" className={inp} />
        </label>

        <label className="block">
          <span className={lbl}>Last Vaccination Date</span>
          <input type="date" value={value.vaccination_date}
            onChange={e => set("vaccination_date", e.target.value)} className={inp} />
        </label>
        <label className="block">
          <span className={lbl}>Status</span>
          <div className="flex items-center gap-5 rounded-lg border border-gray-200 px-3 py-2.5">
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700">
              <input type="checkbox" checked={value.is_vaccinated}
                onChange={e => set("is_vaccinated", e.target.checked)}
                className="h-4 w-4 rounded" />
              Vaccinated
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-red-600">
              <input type="checkbox" checked={value.is_aggressive}
                onChange={e => set("is_aggressive", e.target.checked)}
                className="h-4 w-4 rounded accent-red-500" />
              Aggressive
            </label>
          </div>
        </label>
      </div>

      <label className="block">
        <span className={lbl}>Medical Notes</span>
        <textarea value={value.medical_notes} onChange={e => set("medical_notes", e.target.value)}
          rows={2} placeholder="Any medical conditions, allergies..."
          className={`${inp} resize-none`} />
      </label>
      <label className="block">
        <span className={lbl}>Notes</span>
        <textarea value={value.notes} onChange={e => set("notes", e.target.value)}
          rows={2} placeholder="Additional notes..."
          className={`${inp} resize-none`} />
      </label>
    </div>
  );
}
