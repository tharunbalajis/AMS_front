import { Button, DataTable, SearchBox, Select, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 1, unit_number: "A-101", block_name: "Block A", floor: 1, unit_type: "2BHK", occupancy_status: "OCCUPIED", area_sqft: 1200, parking_count: 1, resident_name: "Aarav Sharma" },
  { id: 2, unit_number: "A-102", block_name: "Block A", floor: 1, unit_type: "3BHK", occupancy_status: "VACANT", area_sqft: 1500, parking_count: 2, resident_name: null },
  { id: 3, unit_number: "B-201", block_name: "Block B", floor: 2, unit_type: "2BHK", occupancy_status: "OCCUPIED", area_sqft: 1100, parking_count: 1, resident_name: "Priya Patel" },
  { id: 4, unit_number: "C-301", block_name: "Block C", floor: 3, unit_type: "STUDIO", occupancy_status: "VACANT", area_sqft: 650, parking_count: 0, resident_name: null },
  { id: 5, unit_number: "D-401", block_name: "Block D", floor: 4, unit_type: "4BHK", occupancy_status: "OCCUPIED", area_sqft: 2000, parking_count: 2, resident_name: "Vijay Mehta" },
  { id: 6, unit_number: "B-102", block_name: "Block B", floor: 1, unit_type: "1BHK", occupancy_status: "OCCUPIED", area_sqft: 800, parking_count: 1, resident_name: "Nisha Reddy" },
  { id: 7, unit_number: "C-202", block_name: "Block C", floor: 2, unit_type: "2BHK", occupancy_status: "VACANT", area_sqft: 1050, parking_count: 1, resident_name: null },
];

export function UnitManagementPage() {
  const { queryParams } = useScope();
  const [block, setBlock] = useState("");
  const [unitType, setUnitType] = useState("");
  const [status, setStatus] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["units", queryParams, block, unitType, status],
    queryFn: () => residentsApi.getUnits({ ...queryParams, block_name: block || undefined, unit_type: unitType || undefined, occupancy_status: status || undefined }),
    retry: false,
  });

  const rows = (() => {
    const fetched = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
    let list = fetched.length ? fetched : MOCK;
    if (block) list = list.filter((u) => String(u.block_name ?? "").toLowerCase().includes(block.toLowerCase()));
    if (unitType) list = list.filter((u) => String(u.unit_type ?? "") === unitType);
    if (status) list = list.filter((u) => String(u.occupancy_status ?? "") === status);
    return list;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Residents / Unit Management</p>
          <h1 className="text-2xl font-bold text-gray-900">Unit Management</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} units</p>
        </div>
        <Button><Plus size={15} className="mr-1" />Add Unit</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select className="w-44" value={block} onChange={(e) => setBlock(e.target.value)}>
          <option value="">All Blocks</option>
          <option value="Block A">Block A</option>
          <option value="Block B">Block B</option>
          <option value="Block C">Block C</option>
          <option value="Block D">Block D</option>
        </Select>
        <Select className="w-44" value={unitType} onChange={(e) => setUnitType(e.target.value)}>
          <option value="">All Types</option>
          <option value="STUDIO">Studio</option>
          <option value="1BHK">1 BHK</option>
          <option value="2BHK">2 BHK</option>
          <option value="3BHK">3 BHK</option>
          <option value="4BHK">4 BHK</option>
        </Select>
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="VACANT">Vacant</option>
        </Select>
      </div>

      <DataTable
        title="Units"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "unit_number", header: "UNIT NO" },
          { key: "block_name", header: "BLOCK" },
          { key: "floor", header: "FLOOR" },
          { key: "unit_type", header: "TYPE" },
          { key: "occupancy_status", header: "STATUS", render: (row) => <StatusBadge value={row.occupancy_status === "OCCUPIED" ? "ACTIVE" : "INACTIVE"} /> },
          { key: "area_sqft", header: "AREA (SQFT)" },
          { key: "parking_count", header: "PARKING" },
          { key: "resident_name", header: "RESIDENT", render: (row) => <span className="text-gray-700">{String(row.resident_name ?? "—")}</span> },
        ]}
      />
    </div>
  );
}
