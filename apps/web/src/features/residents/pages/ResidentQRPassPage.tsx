import { Button, Card, SearchBox } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Download, QrCode } from "lucide-react";
import { useState } from "react";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 1, full_name: "Aarav Sharma", unit_number: "A-101", block_name: "Block A", mobile_primary: "9876543210" },
  { id: 2, full_name: "Priya Patel", unit_number: "B-202", block_name: "Block B", mobile_primary: "9876543211" },
  { id: 3, full_name: "Rahul Kumar", unit_number: "C-305", block_name: "Block C", mobile_primary: "9876543212" },
  { id: 4, full_name: "Vijay Mehta", unit_number: "D-401", block_name: "Block D", mobile_primary: "9876543214" },
  { id: 5, full_name: "Nisha Reddy", unit_number: "B-108", block_name: "Block B", mobile_primary: "9876543215" },
];

export function ResidentQRPassPage() {
  const { queryParams } = useScope();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);

  const { data: raw } = useQuery({
    queryKey: ["residents-qr", queryParams],
    queryFn: () => residentsApi.getAll({ ...queryParams, limit: 200 }),
    retry: false,
  });
  const all = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const list = (all.length ? all : MOCK).filter((r) => !search || String(r.full_name ?? "").toLowerCase().includes(search.toLowerCase()));

  const initials = selected ? String(selected.full_name ?? "??").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) : "";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Residents / Resident QR Pass</p>
        <h1 className="text-2xl font-bold text-gray-900">Resident QR Pass</h1>
        <p className="mt-1 text-sm text-gray-500">Generate and download resident entry passes</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="flex flex-col gap-3 p-4">
          <SearchBox placeholder="Search resident..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 420 }}>
            {list.map((r) => (
              <button
                key={String(r.id)}
                type="button"
                onClick={() => setSelected(r)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${selected?.id === r.id ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {String(r.full_name ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{String(r.full_name ?? "-")}</p>
                  <p className="text-xs text-gray-500">{String(r.unit_number ?? "")} · {String(r.block_name ?? "")}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div>
          {selected ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                {initials}
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900">{String(selected.full_name ?? "-")}</h2>
              <p className="text-sm text-gray-500">{String(selected.unit_number ?? "")} · {String(selected.block_name ?? "")}</p>
              <p className="text-sm text-gray-500">{String(selected.mobile_primary ?? "")}</p>

              <div className="mx-auto mt-6 flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                <div className="text-center text-gray-400">
                  <QrCode size={64} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">QR Code</p>
                  <p className="text-xs">ID-{String(selected.id).padStart(5, "0")}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <Button variant="secondary">Preview Pass</Button>
                <Button><Download size={15} className="mr-1" />Download Pass</Button>
              </div>
            </Card>
          ) : (
            <Card className="flex h-full min-h-[300px] items-center justify-center p-8 text-center">
              <div>
                <QrCode size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="font-medium text-gray-500">Select a resident to generate QR pass</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
