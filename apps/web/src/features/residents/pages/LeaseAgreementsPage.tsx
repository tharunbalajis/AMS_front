import { Button, DataTable, SearchBox, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { FilePlus } from "lucide-react";
import { useState } from "react";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 1, full_name: "Priya Patel", unit_number: "B-202", block_name: "Block B", lease_start: "2023-03-01", lease_end: "2024-02-29", rent_monthly: 18000, is_active: true },
  { id: 2, full_name: "Arjun Singh", unit_number: "C-201", block_name: "Block C", lease_start: "2023-08-01", lease_end: "2024-07-31", rent_monthly: 22000, is_active: true },
  { id: 3, full_name: "Sneha Gupta", unit_number: "A-204", block_name: "Block A", lease_start: "2022-07-01", lease_end: "2023-06-30", rent_monthly: 15000, is_active: false },
  { id: 4, full_name: "Kavya Nair", unit_number: "D-305", block_name: "Block D", lease_start: "2024-01-01", lease_end: "2024-12-31", rent_monthly: 25000, is_active: true },
  { id: 5, full_name: "Ravi Shankar", unit_number: "B-110", block_name: "Block B", lease_start: "2023-11-01", lease_end: "2024-10-31", rent_monthly: 19500, is_active: true },
];

export function LeaseAgreementsPage() {
  const { queryParams } = useScope();
  const [search, setSearch] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["leases", queryParams, search],
    queryFn: () => residentsApi.getAll({ ...queryParams, resident_type: "TENANT", search: search || undefined }),
    retry: false,
  });

  const fetched = normalizeList<Record<string, unknown>>(raw?.data ?? raw).filter((r) => String(r.resident_type ?? "").toUpperCase() === "TENANT");
  const rows = fetched.length ? fetched : MOCK;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Residents / Lease Agreements</p>
          <h1 className="text-2xl font-bold text-gray-900">Lease Agreements</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} active lease records</p>
        </div>
        <Button><FilePlus size={15} className="mr-1" />New Lease</Button>
      </div>

      <SearchBox className="max-w-md" placeholder="Search tenant, unit..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <DataTable
        title="Lease Records"
        rows={rows}
        isLoading={isLoading}
        columns={[
          {
            key: "full_name", header: "TENANT",
            render: (row) => (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                  {String(row.full_name ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <span className="font-medium">{String(row.full_name ?? "-")}</span>
              </div>
            )
          },
          { key: "unit_number", header: "UNIT" },
          { key: "lease_start", header: "START" },
          { key: "lease_end", header: "END" },
          {
            key: "rent_monthly", header: "RENT / MO",
            render: (row) => <span className="font-medium">₹{Number(row.rent_monthly ?? 0).toLocaleString("en-IN")}</span>
          },
          { key: "is_active", header: "STATUS", render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "CLOSED"} /> },
        ]}
      />
    </div>
  );
}
