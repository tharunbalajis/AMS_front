import { Button, DataTable, SearchBox, Select } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Car } from "lucide-react";
import { useState } from "react";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 1, vehicle_number: "KA-01-AB-1234", vehicle_type: "Car", brand: "Maruti Swift", color: "White", unit_number: "A-101", owner_name: "Aarav Sharma", parking_slot: "P-01" },
  { id: 2, vehicle_number: "KA-02-CD-5678", vehicle_type: "Bike", brand: "Royal Enfield", color: "Black", unit_number: "B-202", owner_name: "Priya Patel", parking_slot: "P-15" },
  { id: 3, vehicle_number: "KA-03-EF-9012", vehicle_type: "Car", brand: "Honda City", color: "Silver", unit_number: "C-305", owner_name: "Rahul Kumar", parking_slot: "P-07" },
  { id: 4, vehicle_number: "KA-04-GH-3456", vehicle_type: "Car", brand: "Toyota Innova", color: "Grey", unit_number: "D-401", owner_name: "Vijay Mehta", parking_slot: "P-22" },
  { id: 5, vehicle_number: "KA-05-IJ-7890", vehicle_type: "Bike", brand: "Honda Activa", color: "Red", unit_number: "B-108", owner_name: "Nisha Reddy", parking_slot: "P-31" },
];

export function VehicleManagementPage() {
  const { queryParams } = useScope();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["residents-vehicles", queryParams],
    queryFn: () => residentsApi.getAll({ ...queryParams, limit: 100 }),
    retry: false,
  });
  const residents = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const rows = residents.length ? residents.filter((r) => {
    if (search && !String(r.vehicle_number ?? r.full_name ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }) : MOCK.filter((r) => {
    if (search && !String(r.vehicle_number ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (type && String(r.vehicle_type ?? "") !== type) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Residents / Vehicle Management</p>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} registered vehicles</p>
        </div>
        <Button><Car size={15} className="mr-1" />Add Vehicle</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBox className="min-w-[240px] flex-1" placeholder="Search vehicle number, owner..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="w-40" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="Car">Car</option>
          <option value="Bike">Bike</option>
          <option value="Truck">Truck</option>
        </Select>
      </div>

      <DataTable
        title="Vehicles"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "vehicle_number", header: "VEHICLE NO", render: (row) => <span className="font-mono font-medium">{String(row.vehicle_number ?? "-")}</span> },
          { key: "vehicle_type", header: "TYPE" },
          { key: "brand", header: "BRAND" },
          { key: "color", header: "COLOR" },
          { key: "unit_number", header: "UNIT" },
          { key: "owner_name", header: "OWNER" },
          { key: "parking_slot", header: "PARKING" },
        ]}
      />
    </div>
  );
}
