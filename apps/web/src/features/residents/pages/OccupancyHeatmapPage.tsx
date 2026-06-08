import { useQuery } from "@tanstack/react-query";
import { unitsApi } from "../../../app/api/client";
import { useScope } from "../../../app/scope/ScopeProvider";

interface UnitCell {
  unit_id: number;
  unit_number: string;
  unit_type: string;
  is_occupied: boolean;
  primary_resident: string | null;
}

interface Floor {
  floor_number: number;
  units: UnitCell[];
}

interface Block {
  block_id: number;
  block_name: string;
  floors: Floor[];
}

export function OccupancyHeatmapPage() {
  const { society } = useScope();
  const { data, isLoading, error } = useQuery({
    queryKey: ["heatmap", society?.society_id],
    queryFn: async () => {
      const res = await unitsApi.heatmap(society?.society_id);
      return res.data as unknown as { society_id: number; blocks: Block[] };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-sm text-gray-500 animate-pulse">Loading occupancy map…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
        Failed to load occupancy data.
      </div>
    );
  }

  const totalUnits = data.blocks.flatMap(b => b.floors).flatMap(f => f.units).length;
  const occupiedUnits = data.blocks.flatMap(b => b.floors).flatMap(f => f.units).filter(u => u.is_occupied).length;
  const pct = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Occupancy Map</h1>
        <p className="text-sm text-gray-500 mt-1">
          {occupiedUnits} / {totalUnits} units occupied — {pct}% occupancy
        </p>
      </div>

      <div className="flex gap-4 text-xs font-medium">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-green-500" /> Occupied
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-gray-200" /> Vacant
        </span>
      </div>

      <div className="space-y-8">
        {data.blocks.map(block => (
          <div key={block.block_id} className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-gray-700 uppercase tracking-wide">{block.block_name}</h2>
            <div className="space-y-4">
              {block.floors.map(floor => (
                <div key={floor.floor_number}>
                  <p className="mb-2 text-xs text-gray-500 font-medium">
                    Floor {floor.floor_number === 0 ? "G" : floor.floor_number}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {floor.units.map(unit => (
                      <div
                        key={unit.unit_id}
                        title={unit.primary_resident ? `${unit.unit_number}: ${unit.primary_resident}` : `${unit.unit_number}: Vacant`}
                        className={`relative flex h-12 w-14 flex-col items-center justify-center rounded-md text-xs font-semibold cursor-default border ${
                          unit.is_occupied
                            ? "bg-green-50 border-green-300 text-green-800"
                            : "bg-gray-50 border-gray-200 text-gray-500"
                        }`}
                      >
                        <span>{unit.unit_number}</span>
                        {unit.is_occupied && unit.primary_resident && (
                          <span className="truncate w-full text-center text-[9px] text-green-600 px-1">
                            {unit.primary_resident.split(" ")[0]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
