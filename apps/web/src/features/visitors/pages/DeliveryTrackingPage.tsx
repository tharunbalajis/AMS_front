import { Button, DataTable, SearchBox, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { visitorsApi } from "@/api/visitors.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 1, delivery_person_name: "Ravi Kumar", company: "Amazon", unit_number: "B-202", item: "Package", check_in: "11:15 AM", status: "INSIDE", collected_by: null },
  { id: 2, delivery_person_name: "Sanjay Rao", company: "Flipkart", unit_number: "A-101", item: "Clothes", check_in: "09:30 AM", status: "COLLECTED", collected_by: "Aarav Sharma" },
  { id: 3, delivery_person_name: "Mohan Das", company: "Swiggy", unit_number: "C-305", item: "Food Order", check_in: "01:00 PM", status: "COLLECTED", collected_by: "Rahul Kumar" },
  { id: 4, delivery_person_name: "Pradeep Singh", company: "Zomato", unit_number: "D-401", item: "Food Order", check_in: "02:30 PM", status: "INSIDE", collected_by: null },
  { id: 5, delivery_person_name: "Kishore Nair", company: "DTDC", unit_number: "B-108", item: "Documents", check_in: "10:00 AM", status: "COLLECTED", collected_by: "Nisha Reddy" },
];

export function DeliveryTrackingPage() {
  const { queryParams } = useScope();
  const [search, setSearch] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["deliveries", queryParams],
    queryFn: () => visitorsApi.getDeliveries({ ...queryParams }),
    retry: false,
  });
  const fetched = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const rows = fetched.length ? fetched : MOCK.filter((r) => !search || String(r.delivery_person_name ?? "").toLowerCase().includes(search.toLowerCase()) || String(r.company ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Visitor & Security / Delivery Tracking</p>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} deliveries today</p>
        </div>
        <Button variant="secondary"><Download size={15} className="mr-1" />Export</Button>
      </div>

      <SearchBox className="max-w-md" placeholder="Search delivery agent, company..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <DataTable
        title="Deliveries"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "delivery_person_name", header: "AGENT" },
          { key: "company", header: "COMPANY" },
          { key: "unit_number", header: "UNIT" },
          { key: "item", header: "ITEM" },
          { key: "check_in", header: "CHECK-IN" },
          { key: "status", header: "STATUS", render: (row) => <StatusBadge value={row.status === "COLLECTED" ? "RESOLVED" : "INSIDE"} /> },
          { key: "collected_by", header: "COLLECTED BY", render: (row) => <span>{String(row.collected_by ?? "Pending")}</span> },
        ]}
      />
    </div>
  );
}
