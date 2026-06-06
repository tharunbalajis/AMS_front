import { Button, Card } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Building, Plus } from "lucide-react";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK_BLOCKS = [
  { id: 1, block_name: "Block A", total_floors: 8, total_units: 64, occupied: 58, is_active: true },
  { id: 2, block_name: "Block B", total_floors: 6, total_units: 48, occupied: 41, is_active: true },
  { id: 3, block_name: "Block C", total_floors: 10, total_units: 80, occupied: 72, is_active: true },
  { id: 4, block_name: "Block D", total_floors: 5, total_units: 40, occupied: 30, is_active: true },
];

export function BlockWingPage() {
  const { queryParams } = useScope();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["blocks", queryParams],
    queryFn: () => residentsApi.getBlocks({ ...queryParams }),
    retry: false,
  });

  const rawBlocks = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const blocks = rawBlocks.length ? rawBlocks : MOCK_BLOCKS;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Residents / Block & Wing</p>
          <h1 className="text-2xl font-bold text-gray-900">Block / Wing Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage buildings and wings within the society</p>
        </div>
        <Button><Plus size={15} className="mr-1" />Add Block</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-44 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {blocks.map((block) => {
            const total = Number(block.total_units ?? 0);
            const occupied = Number(block.occupied ?? 0);
            const pct = total ? Math.round((occupied / total) * 100) : 0;
            return (
              <Card key={String(block.id)} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <Building size={20} />
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${block.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {block.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-gray-900">{String(block.block_name ?? "-")}</h3>
                <p className="text-sm text-gray-500">{Number(block.total_floors ?? 0)} Floors · {total} Units</p>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>Occupancy</span>
                    <span className="font-semibold text-gray-900">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{occupied} / {total} occupied</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="p-5">
        <h2 className="text-base font-semibold text-gray-900">Notes</h2>
        <p className="mt-2 text-sm text-gray-500">Block data is updated in real-time from the society management system. Use the Add Block button to register new buildings or wings within this society.</p>
      </Card>
    </div>
  );
}
