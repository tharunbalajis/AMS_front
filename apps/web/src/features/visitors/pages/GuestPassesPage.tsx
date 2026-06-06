import { Button, DataTable, SearchBox, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Plus, QrCode } from "lucide-react";
import { useState } from "react";
import { visitorsApi } from "@/api/visitors.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 1, pass_id: "PASS-20240115-001", resident_name: "Aarav Sharma", guest_name: "Rahul Verma", valid_from: "2024-01-15", valid_to: "2024-01-15", is_active: true },
  { id: 2, pass_id: "PASS-20240114-002", resident_name: "Priya Patel", guest_name: "Sister Meera", valid_from: "2024-01-14", valid_to: "2024-01-16", is_active: true },
  { id: 3, pass_id: "PASS-20240112-003", resident_name: "Rahul Kumar", guest_name: "Office Colleague", valid_from: "2024-01-12", valid_to: "2024-01-12", is_active: false },
  { id: 4, pass_id: "PASS-20240111-004", resident_name: "Vijay Mehta", guest_name: "Parent Visit", valid_from: "2024-01-11", valid_to: "2024-01-14", is_active: false },
  { id: 5, pass_id: "PASS-20240110-005", resident_name: "Nisha Reddy", guest_name: "Friend Kavya", valid_from: "2024-01-10", valid_to: "2024-01-10", is_active: false },
];

export function GuestPassesPage() {
  const { queryParams } = useScope();
  const [search, setSearch] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["guest-passes", queryParams],
    queryFn: () => visitorsApi.getPasses({ ...queryParams }),
    retry: false,
  });
  const fetched = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const rows = (fetched.length ? fetched : MOCK).filter((r) => !search || String(r.pass_id ?? "").toLowerCase().includes(search.toLowerCase()) || String(r.guest_name ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Visitor & Security / Guest Passes</p>
          <h1 className="text-2xl font-bold text-gray-900">Guest Passes</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} passes issued</p>
        </div>
        <Button><Plus size={15} className="mr-1" />New Pass</Button>
      </div>

      <SearchBox className="max-w-md" placeholder="Search pass ID, guest name..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <DataTable
        title="Guest Passes"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "pass_id", header: "PASS ID", render: (row) => <span className="font-mono text-xs font-medium">{String(row.pass_id ?? "-")}</span> },
          { key: "resident_name", header: "RESIDENT" },
          { key: "guest_name", header: "GUEST" },
          { key: "valid_from", header: "FROM" },
          { key: "valid_to", header: "TO" },
          { key: "is_active", header: "STATUS", render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "CLOSED"} /> },
          { key: "qr", header: "QR", render: () => <button type="button" className="rounded p-1 text-gray-400 hover:text-blue-600"><QrCode size={16} /></button> },
        ]}
      />
    </div>
  );
}
