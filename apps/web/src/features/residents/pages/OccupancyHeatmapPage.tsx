import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useRef, useEffect } from "react";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";
import { QK } from "@/lib/queryKeys";
import {
  Car, PawPrint, Key, Users, Home, Phone, Mail,
  Calendar, FileText, X, Edit, UserMinus, Plus,
  QrCode, Loader2,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────── */
/* STATUS CONFIG                                               */
/* ─────────────────────────────────────────────────────────── */

function statusConfig(status: string) {
  const s = String(status ?? "").toUpperCase();
  switch (s) {
    case "OWNER_OCCUPIED": return { label: "Owner", bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  dot: "bg-green-500"  };
    case "RENTED":
    case "TENANT_OCCUPIED": return { label: "Tenant", bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   dot: "bg-blue-500"   };
    case "MAINTENANCE":     return { label: "Maint.",  bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", dot: "bg-orange-500" };
    case "RESERVED":        return { label: "Reserv.", bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300", dot: "bg-purple-500" };
    default:                return { label: "Vacant",  bg: "bg-gray-100",   text: "text-gray-400",   border: "border-gray-200",   dot: "bg-gray-300"   };
  }
}

/* ─────────────────────────────────────────────────────────── */
/* HOVER TOOLTIP                                               */
/* ─────────────────────────────────────────────────────────── */

function UnitTooltip({ unit }: { unit: any }) {
  const cfg = statusConfig(unit.occupancy_status);
  return (
    <div className="pointer-events-none absolute z-50 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-2xl"
         style={{ bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm text-gray-900">{unit.unit_number}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </span>
      </div>
      {unit.owner_name && (
        <div className="text-xs text-gray-600 mb-1">
          <span className="font-medium text-gray-500">Owner:</span> {unit.owner_name}
        </div>
      )}
      {unit.tenant_name && (
        <div className="text-xs text-gray-600 mb-1">
          <span className="font-medium text-gray-500">Tenant:</span> {unit.tenant_name}
        </div>
      )}
      {(unit.occupant_count > 0) && (
        <div className="text-xs text-gray-600 mb-1">
          <span className="font-medium text-gray-500">Members:</span> {unit.occupant_count}
        </div>
      )}
      <div className="mt-1.5 flex gap-2 text-[10px] text-gray-400">
        {unit.vehicle_count > 0 && <span className="flex items-center gap-0.5"><Car size={10} /> {unit.vehicle_count}</span>}
        {unit.pet_count > 0 && <span className="flex items-center gap-0.5"><PawPrint size={10} /> {unit.pet_count}</span>}
        {unit.lease_active && <span className="flex items-center gap-0.5"><FileText size={10} /> Lease</span>}
      </div>
      <div className="mt-1.5 text-[9px] text-gray-300 text-center">Click for full details</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* UNIT CELL                                                   */
/* ─────────────────────────────────────────────────────────── */

function UnitCell({ unit, onClick }: { unit: any; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const cfg = statusConfig(unit.occupancy_status);
  const count = Number(unit.occupant_count ?? 0);

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-lg border p-2 text-center text-xs font-medium transition-all duration-150
          hover:scale-105 hover:shadow-md active:scale-95 cursor-pointer
          ${cfg.bg} ${cfg.text} ${cfg.border}`}
      >
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          <span className="font-semibold leading-tight">{unit.unit_number}</span>
        </div>
        <div className="text-[10px] leading-tight opacity-75">
          {unit.unit_type || cfg.label}
        </div>
        {count > 0 && (
          <div className="mt-0.5 text-[9px] font-bold opacity-80">
            {count}👤
          </div>
        )}
      </button>
      {hovered && <UnitTooltip unit={unit} />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* UNIT DETAIL DRAWER                                          */
/* ─────────────────────────────────────────────────────────── */

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between py-1.5 text-sm border-b border-gray-50 last:border-0">
      <span className="text-gray-500 w-28 shrink-0">{label}</span>
      <span className="text-gray-900 text-right font-medium">{value}</span>
    </div>
  );
}

function UnitDetailDrawer({ unitId, onClose }: { unitId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["unit-detail", unitId],
    queryFn: () => residentsApi.getUnitDetail(unitId),
    staleTime: 30_000,
  });

  const d = data as any;
  const cfg = d ? statusConfig(d.occupancy_status) : statusConfig("VACANT");

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b bg-white px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold ${
                d?.occupancy_status === "OWNER_OCCUPIED" ? "bg-green-500" :
                ["RENTED","TENANT_OCCUPIED"].includes(d?.occupancy_status) ? "bg-blue-500" : "bg-gray-400"
              }`}>
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Home size={18} />}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {d ? `Unit ${d.unit_number}` : "Loading…"}
                </h2>
                {d && (
                  <p className="text-xs text-gray-500">
                    {d.block_name} · Floor {d.floor_number ?? 0} · {d.unit_type}
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>
          {d && (
            <span className={`mt-2 inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
              {cfg.label}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-1 items-center justify-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        )}

        {d && !isLoading && (
          <div className="space-y-5 p-5">

            {/* OWNER */}
            {d.owner && (
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <Key size={12} /> Owner
                </h3>
                <div className="rounded-xl bg-green-50 p-3">
                  <p className="font-semibold text-gray-900">{d.owner.full_name}</p>
                  {d.owner.mobile_primary && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
                      <Phone size={10} /> {d.owner.mobile_primary}
                    </p>
                  )}
                  {d.owner.email && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
                      <Mail size={10} /> {d.owner.email}
                    </p>
                  )}
                  {d.owner.move_in_date && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={10} /> Move-in: {String(d.owner.move_in_date).slice(0, 10)}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* TENANT */}
            {d.tenant && (
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <Users size={12} /> Tenant
                </h3>
                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="font-semibold text-gray-900">{d.tenant.full_name}</p>
                  {d.tenant.mobile_primary && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
                      <Phone size={10} /> {d.tenant.mobile_primary}
                    </p>
                  )}
                  {d.tenant.email && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
                      <Mail size={10} /> {d.tenant.email}
                    </p>
                  )}
                  {d.tenant.move_in_date && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={10} /> Move-in: {String(d.tenant.move_in_date).slice(0, 10)}
                    </p>
                  )}
                  {(d.tenant.member_count > 0) && (
                    <p className="mt-1 text-xs font-medium text-blue-700">
                      {d.tenant.member_count} member{d.tenant.member_count !== 1 ? "s" : ""}
                      {d.tenant.adults_count > 0 ? ` · ${d.tenant.adults_count} adults` : ""}
                      {d.tenant.children_count > 0 ? ` · ${d.tenant.children_count} children` : ""}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* OCCUPANCY STATS */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Occupancy</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Members", value: d.occupant_count || 0 },
                  { label: "Vehicles", value: d.vehicles?.length || 0 },
                  { label: "Pets", value: d.pets?.length || 0 },
                ].map(stat => (
                  <div key={stat.label} className="rounded-lg bg-gray-50 p-2 text-center">
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                    <p className="text-[10px] text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* LEASE */}
            {d.lease && (
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <FileText size={12} /> Active Lease
                </h3>
                <div className="rounded-xl border border-gray-100 bg-white p-3 text-sm">
                  <DetailRow label="Start" value={d.lease.lease_start ? String(d.lease.lease_start).slice(0, 10) : null} />
                  <DetailRow label="End" value={d.lease.lease_end ? String(d.lease.lease_end).slice(0, 10) : "Open-ended"} />
                  <DetailRow label="Rent / Month"
                    value={d.lease.monthly_rent > 0 ? `₹${Number(d.lease.monthly_rent).toLocaleString("en-IN")}` : null} />
                  <DetailRow label="Security"
                    value={d.lease.security_deposit > 0 ? `₹${Number(d.lease.security_deposit).toLocaleString("en-IN")}` : null} />
                  <DetailRow label="Status" value={d.lease.status} />
                </div>
              </section>
            )}

            {/* VEHICLES */}
            {d.vehicles?.length > 0 && (
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <Car size={12} /> Vehicles ({d.vehicles.length})
                </h3>
                <div className="space-y-1.5">
                  {d.vehicles.map((v: any) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-lg border bg-gray-50 px-3 py-2">
                      <Car size={14} className="text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900 font-mono">{v.registration_no || "—"}</p>
                        <p className="text-[10px] text-gray-500">
                          {[v.vehicle_type, v.make, v.model, v.color].filter(Boolean).join(" · ")}
                        </p>
                        {v.parking_slot && (
                          <p className="text-[10px] text-blue-600">Slot: {v.parking_slot}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PETS */}
            {d.pets?.length > 0 && (
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <PawPrint size={12} /> Pets ({d.pets.length})
                </h3>
                <div className="space-y-1.5">
                  {d.pets.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border bg-gray-50 px-3 py-2">
                      <PawPrint size={14} className="text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{p.pet_name}</p>
                        <p className="text-[10px] text-gray-500">
                          {[p.species, p.breed].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PARKING */}
            {d.parking?.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Parking Slots
                </h3>
                <div className="flex flex-wrap gap-2">
                  {d.parking.map((ps: any, i: number) => (
                    <span key={i} className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {ps.slot_code}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* QUICK ACTIONS */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Edit Resident", icon: Edit, action: () => {} },
                  { label: "Move Out", icon: UserMinus, action: () => {} },
                  { label: "Add Vehicle", icon: Car, action: () => {} },
                  { label: "Add Pet", icon: PawPrint, action: () => {} },
                  { label: "Generate QR", icon: QrCode, action: () => {} },
                  { label: "View Lease", icon: FileText, action: () => {} },
                ].map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <Icon size={13} className="text-gray-400" />
                    {label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* MAIN PAGE                                                   */
/* ─────────────────────────────────────────────────────────── */

export function OccupancyHeatmapPage() {
  const { selectedSocietyId: societyId, selectedBlockId: blockId } = useScope();
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("");

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
    refetchOnMount: "always",
    select: (data) => {
      const raw = (data as any)?.data ?? data ?? [];
      return Array.isArray(raw) ? raw : [];
    },
  });

  const allUnits = unitsQuery.data ?? [];

  // Enrich units with vehicle/pet/lease counts from available data
  const units = useMemo(() => allUnits.map((u: any) => ({
    ...u,
    vehicle_count: 0,
    pet_count: 0,
    lease_active: ["RENTED", "TENANT_OCCUPIED"].includes(String(u.occupancy_status ?? "").toUpperCase()),
  })), [allUnits]);

  const filtered = useMemo(() => {
    if (!filterStatus) return units;
    return units.filter((u: any) => {
      const s = String(u.occupancy_status ?? "").toUpperCase();
      if (filterStatus === "VACANT") return s === "VACANT";
      if (filterStatus === "OWNER_OCCUPIED") return s === "OWNER_OCCUPIED";
      if (filterStatus === "RENTED") return s === "RENTED" || s === "TENANT_OCCUPIED";
      return true;
    });
  }, [units, filterStatus]);

  const grouped = useMemo(() => {
    const byBlock = new Map<string, Map<number, any[]>>();
    filtered.forEach((unit: any) => {
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
  }, [filtered]);

  const totalUnits    = units.length;
  const vacantUnits   = units.filter((u: any) => String(u.occupancy_status ?? "").toUpperCase() === "VACANT").length;
  const ownerUnits    = units.filter((u: any) => String(u.occupancy_status ?? "").toUpperCase() === "OWNER_OCCUPIED").length;
  const rentedUnits   = units.filter((u: any) => ["RENTED", "TENANT_OCCUPIED"].includes(String(u.occupancy_status ?? "").toUpperCase())).length;
  const occupiedUnits = ownerUnits + rentedUnits;
  const pct           = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  if (!societyId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-700">
        Please select a society to view the occupancy map.
      </div>
    );
  }

  if (unitsQuery.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={18} className="animate-spin" />
          Loading occupancy map…
        </div>
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
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Residents / Occupancy Map</p>
          <h1 className="text-2xl font-bold text-gray-900">Occupancy Map</h1>
          <p className="mt-1 text-sm text-gray-500">
            {occupiedUnits} / {totalUnits} units occupied — {pct}% occupancy
          </p>
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
        >
          <option value="">All Status</option>
          <option value="VACANT">Vacant</option>
          <option value="OWNER_OCCUPIED">Owner Occupied</option>
          <option value="RENTED">Tenant / Rented</option>
        </select>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Units",    value: totalUnits,    bg: "bg-gray-50",   text: "text-gray-700"   },
          { label: "Owner Occupied", value: ownerUnits,    bg: "bg-green-50",  text: "text-green-700"  },
          { label: "Tenant Rented",  value: rentedUnits,   bg: "bg-blue-50",   text: "text-blue-700"   },
          { label: "Vacant",         value: vacantUnits,   bg: "bg-amber-50",  text: "text-amber-700"  },
        ].map(k => (
          <div key={k.label} className={`rounded-xl p-3 ${k.bg}`}>
            <p className={`text-2xl font-bold ${k.text}`}>{k.value}</p>
            <p className={`text-xs font-medium opacity-70 ${k.text}`}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-medium">
        {[
          { label: "Owner Occupied", bg: "bg-green-100",  border: "border-green-300"  },
          { label: "Tenant Rented",  bg: "bg-blue-100",   border: "border-blue-300"   },
          { label: "Vacant",         bg: "bg-gray-100",   border: "border-gray-200"   },
          { label: "Maintenance",    bg: "bg-orange-100", border: "border-orange-300" },
          { label: "Reserved",       bg: "bg-purple-100", border: "border-purple-300" },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5 text-gray-600">
            <span className={`h-3 w-3 rounded-sm border ${l.bg} ${l.border}`} />
            {l.label}
          </span>
        ))}
        <span className="ml-auto text-gray-400 italic">Hover for preview · Click for details</span>
      </div>

      {/* Heatmap */}
      {grouped.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center text-sm text-gray-500">
          No units found{filterStatus ? " matching the selected filter" : " for this society"}.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((block) => (
            <div key={block.blockName} className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
                <Home size={14} className="text-gray-400" />
                Block {block.blockName}
                <span className="ml-auto text-xs font-normal normal-case text-gray-400">
                  {block.floors.reduce((t, f) => t + f.units.length, 0)} units
                </span>
              </h2>
              <div className="space-y-4">
                {block.floors.map((floor) => (
                  <div key={floor.floorNumber}>
                    <p className="mb-2 text-xs font-medium text-gray-400">
                      {floor.floorNumber === 0 ? "Ground Floor" : `Floor ${floor.floorNumber}`}
                      <span className="ml-1.5 text-gray-300">({floor.units.length} units)</span>
                    </p>
                    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15">
                      {floor.units.map((unit: any) => (
                        <UnitCell
                          key={unit.unit_id}
                          unit={unit}
                          onClick={() => setSelectedUnitId(Number(unit.unit_id))}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      {selectedUnitId !== null && (
        <UnitDetailDrawer
          unitId={selectedUnitId}
          onClose={() => setSelectedUnitId(null)}
        />
      )}
    </div>
  );
}
