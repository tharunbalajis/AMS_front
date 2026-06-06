import { Button, DataTable, SearchBox, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { PawPrint } from "lucide-react";
import { useState } from "react";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 1, pet_name: "Bruno", pet_type: "Dog", breed: "Labrador", owner_name: "Aarav Sharma", unit_number: "A-101", vaccination_status: "ACTIVE", vaccination_date: "2024-01-10" },
  { id: 2, pet_name: "Whiskers", pet_type: "Cat", breed: "Persian", owner_name: "Priya Patel", unit_number: "B-202", vaccination_status: "ACTIVE", vaccination_date: "2023-11-20" },
  { id: 3, pet_name: "Max", pet_type: "Dog", breed: "German Shepherd", owner_name: "Vijay Mehta", unit_number: "D-401", vaccination_status: "PENDING", vaccination_date: null },
  { id: 4, pet_name: "Goldie", pet_type: "Dog", breed: "Golden Retriever", owner_name: "Nisha Reddy", unit_number: "B-108", vaccination_status: "ACTIVE", vaccination_date: "2024-02-15" },
  { id: 5, pet_name: "Luna", pet_type: "Cat", breed: "Siamese", owner_name: "Arjun Singh", unit_number: "C-201", vaccination_status: "ACTIVE", vaccination_date: "2023-12-05" },
];

export function PetManagementPage() {
  const { queryParams } = useScope();
  const [search, setSearch] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["residents-pets", queryParams],
    queryFn: () => residentsApi.getAll({ ...queryParams, limit: 100 }),
    retry: false,
  });
  const residents = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const rows = residents.length ? residents : MOCK.filter((r) => !search || String(r.pet_name ?? "").toLowerCase().includes(search.toLowerCase()) || String(r.owner_name ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Residents / Pet Management</p>
          <h1 className="text-2xl font-bold text-gray-900">Pet Management</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} registered pets</p>
        </div>
        <Button><PawPrint size={15} className="mr-1" />Register Pet</Button>
      </div>

      <SearchBox className="max-w-md" placeholder="Search pet name, owner..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <DataTable
        title="Pets"
        rows={rows}
        isLoading={isLoading}
        columns={[
          {
            key: "pet_name", header: "PET",
            render: (row) => (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <PawPrint size={14} />
                </div>
                <span className="font-medium">{String(row.pet_name ?? "-")}</span>
              </div>
            )
          },
          { key: "pet_type", header: "TYPE" },
          { key: "breed", header: "BREED" },
          { key: "owner_name", header: "OWNER" },
          { key: "unit_number", header: "UNIT" },
          { key: "vaccination_status", header: "VACCINATION", render: (row) => <StatusBadge value={row.vaccination_status ?? "PENDING"} /> },
        ]}
      />
    </div>
  );
}
