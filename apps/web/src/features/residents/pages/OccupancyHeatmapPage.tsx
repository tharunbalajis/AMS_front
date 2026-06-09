import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";
import { QK } from "@/lib/queryKeys";

function UnitCell({ unit }: { unit: any }) {
  const status = String(unit.occupancy_status ?? "VACANT").toUpperCase();
  const count = Number(unit.occupant_count ?? 0);

  const colorClass =
    status === "VACANT"
      ? "bg-gray-100 text-gray-400 border-gray-200"
      : status === "OWNER_OCCUPIED"
      ? "bg-green-100 text-green-800 border-green-200"
      : status === "RENTED"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : count > 10
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-gray-50 text-gray-600 border-gray-200";

  const label =
    status === "VACANT" ? "Vacant" : `${count} Member${count === 1 ? "" : "s"}`;

  return (
    <div
      title={`${unit.unit_number}\n${label}`}
      className={`rounded border p-2 text-center text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${colorClass}`}
    >
      <div className="font-semibold leading-tight">{unit.unit_number}</div>
      <div className="mt-0.5 text-[10px] leading-tight">{label}</div>
    </div>
  );
}

export function OccupancyHeatmapPage() {
  const { selectedSocietyId: societyId, selectedBlockId: blockId } = useScope();

  const unitsQuery = useQuery({
    queryKey: QK.occupancyHeatmap(societyId ?? 0),
    queryFn: () =>
      residentsApi.getUnits({
        society_id: societyId,
        block_id: blockId || undefined,
        page: 1,
        page_size: 2000,
      }),
    enabled: !!societyId,
    staleTime: 0,
    select: (data) => {
      const raw = (data as any)?.data ?? data ?? [];
      return Array.isArray(raw) ? raw : [];
    },
  });

  const units = unitsQuery.data ?? [];

  const grouped = useMemo(() => {
    const byBlock = new Map<string, Map<number, any[]>>();

    units.forEach((unit: any) => {
      const blockName = String(unit.block_name ?? "Unknown Block");
      const floor = Number(unit.floor_number ?? 0);
      if (!byBlock.has(blockName)) byBlock.set(blockName, new Map());
      const floorMap = byBlock.get(blockName)!;
      if (!floorMap.has(floor)) floorMap.set(floor, []);
      floorMap.get(floor)!.push(unit);
    });

    return Array.from(byBlock.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([blockName, floorMap]) => ({
        blockName,
        floors: Array.from(floorMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([floorNumber, floorUnits]) => ({
            floorNumber,
            units: floorUnits.sort((a: any, b: any) =>
              String(a.unit_number).localeCompare(String(b.unit_number))
            ),
          })),
      }));
  }, [units]);

  const totalUnits    = units.length;
  const vacantUnits   = units.filter((u: any) => String(u.occupancy_status ?? "").toUpperCase() === "VACANT").length;
  const ownerUnits    = units.filter((u: any) => String(u.occupancy_status ?? "").toUpperCase() === "OWNER_OCCUPIED").length;
  const rentedUnits   = units.filter((u: any) => String(u.occupancy_status ?? "").toUpperCase() === "RENTED").length;
  const occupiedUnits = ownerUnits + rentedUnits;
  const pct           = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  if (unitsQuery.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="animate-pulse text-sm text-gray-500">Loading occupancy map…</div>
      </div>
    );
  }

  if (!societyId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-700">
        Please select a society to view the occupancy map.
      </div>
    );
  }

  if (unitsQuery.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
        Failed to load occupancy data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Occupancy Map</h1>
        <p className="mt-1 text-sm text-gray-500">
          {occupiedUnits} / {totalUnits} units occupied — {pct}% occupancy
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-xs font-medium">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-green-200 bg-green-100" />
          Owner Occupied ({ownerUnits})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-blue-200 bg-blue-100" />
          Rented ({rentedUnits})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-gray-200 bg-gray-100" />
          Vacant ({vacantUnits})
        </span>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center text-sm text-gray-500">
          No units found for this society.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((block) => (
            <div key={block.blockName} className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">
                Block {block.blockName}
              </h2>
              <div className="space-y-4">
                {block.floors.map((floor) => (
                  <div key={floor.floorNumber}>
                    <p className="mb-2 text-xs font-medium text-gray-400">
                      Floor {floor.floorNumber === 0 ? "G (Ground)" : floor.floorNumber}
                    </p>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                      {floor.units.map((unit: any) => (
                        <UnitCell key={unit.unit_id} unit={unit} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
