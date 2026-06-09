import { useQuery } from "@tanstack/react-query";
import { residentsApi } from "../../../api/residents.api";

interface Block {
  block_id: number;
  block_name: string;
}

interface Unit {
  unit_id: number;
  unit_number: string;
  block_id: number;
  floor_number?: number;
}

interface UnitSelectorProps {
  societyId?: number;
  value?: number | null;
  onChange: (unitId: number | null) => void;
  className?: string;
  required?: boolean;
}

export function UnitSelector({ societyId, value, onChange, className = "", required }: UnitSelectorProps) {
  const { data: blocks = [] } = useQuery<Block[]>({
    queryKey: ["blocks", societyId],
    queryFn: async () => {
      const res = await residentsApi.getBlocks(societyId ? { society_id: societyId } : {});
      return ((res as any)?.data ?? []) as Block[];
    },
    enabled: true,
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["units", societyId],
    queryFn: async () => {
      const res = await residentsApi.getUnits(societyId ? { society_id: societyId, page_size: 500 } : { page_size: 500 });
      const raw = ((res as any)?.data ?? res) as Unit[] | { data: Unit[] } | { items: Unit[] };
      if (Array.isArray(raw)) return raw;
      if ("data" in raw && Array.isArray(raw.data)) return raw.data;
      if ("items" in raw && Array.isArray(raw.items)) return raw.items;
      return [];
    },
    enabled: true,
  });

  const blockMap = new Map(blocks.map(b => [b.block_id, b.block_name]));
  const selectedUnit = units.find(u => u.unit_id === value);
  const selectedBlockId = selectedUnit?.block_id ?? "";

  const filteredUnits = selectedBlockId
    ? units.filter(u => u.block_id === Number(selectedBlockId))
    : units;

  return (
    <div className={`flex gap-2 ${className}`}>
      <select
        className="flex-1 border rounded px-3 py-2 text-sm"
        value={selectedBlockId}
        onChange={e => {
          onChange(null);
        }}
      >
        <option value="">All Blocks</option>
        {blocks.map(b => (
          <option key={b.block_id} value={b.block_id}>{b.block_name}</option>
        ))}
      </select>

      <select
        className="flex-1 border rounded px-3 py-2 text-sm"
        value={value ?? ""}
        required={required}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Select Unit</option>
        {filteredUnits.map(u => (
          <option key={u.unit_id} value={u.unit_id}>
            {blockMap.get(u.block_id) ? `${blockMap.get(u.block_id)} / ` : ""}{u.unit_number}
          </option>
        ))}
      </select>
    </div>
  );
}
