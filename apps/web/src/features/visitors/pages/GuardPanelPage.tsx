import { Button, Card, SearchBox } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { visitorsApi } from "@/api/visitors.api";
import { useScope } from "@/app/scope/ScopeProvider";

const TYPE_COLOR: Record<string, string> = {
  GUEST:    "bg-blue-500",
  DELIVERY: "bg-amber-500",
  SERVICE:  "bg-purple-500",
  VENDOR:   "bg-green-500",
};

function CheckOutButton({ id }: { id: string }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => visitorsApi.checkOut(id),
    onSuccess: () => {
      toast.success("Visitor checked out");
      qc.invalidateQueries({ queryKey: ["guard-visitors"] });
    },
    onError: () => toast.error("Checkout failed"),
  });
  return (
    <Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => mut.mutate()} disabled={mut.isPending}>
      <LogOut size={12} className="mr-1" />Exit
    </Button>
  );
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function GuardPanelPage() {
  const { queryParams } = useScope();
  const [search, setSearch] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["guard-visitors", queryParams],
    queryFn: () => visitorsApi.getAll({ society_id: queryParams.society_id, page: 1, page_size: 50 }),
    refetchInterval: 30_000,
    retry: false,
  });
  const visitors = normalizeList<Record<string, unknown>>(raw?.data ?? raw);

  const inside = visitors
    .filter((v) => !v.check_out_at)
    .filter((v) =>
      !search
      || String(v.visitor_name ?? "").toLowerCase().includes(search.toLowerCase())
      || String(v.unit_number ?? "").toLowerCase().includes(search.toLowerCase())
    );

  const todayCount = visitors.length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / Guard Panel</p>
        <h1 className="text-2xl font-bold text-gray-900">Guard Panel</h1>
        <p className="mt-1 text-sm text-gray-500">Gate entry management for security personnel</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBox className="min-w-[260px] flex-1" placeholder="Search visitor, unit..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button variant="danger">
          <AlertTriangle size={15} className="mr-1" />SOS Alert
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="p-5">
          <h2 className="mb-1 text-base font-semibold text-gray-900">Currently Inside</h2>
          <p className="mb-4 text-xs text-gray-400">{inside.length} visitor{inside.length !== 1 ? "s" : ""} on premises</p>

          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          )}

          {!isLoading && inside.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">No visitors currently inside</p>
          )}

          <div className="space-y-3">
            {inside.map((entry) => {
              const type  = String(entry.visitor_type ?? entry.type ?? "GUEST").toUpperCase();
              const color = TYPE_COLOR[type] ?? "bg-gray-500";
              const name  = String(entry.visitor_name ?? "Unknown");
              return (
                <div key={String(entry.id)} className="flex items-center gap-4 rounded-lg border border-gray-100 px-4 py-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}>
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500">Unit {String(entry.unit_number ?? "-")} · {type}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {entry.check_in_at ? timeAgo(String(entry.check_in_at)) : "-"}
                  </div>
                  <CheckOutButton id={String(entry.id)} />
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900">Gate Status</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: "Main Gate",    status: "Open",   bg: "bg-green-50",  pill: "bg-green-100 text-green-700" },
                { label: "Side Gate",    status: "Closed", bg: "bg-red-50",    pill: "bg-red-100 text-red-700" },
                { label: "Parking Gate", status: "Open",   bg: "bg-green-50",  pill: "bg-green-100 text-green-700" },
              ].map((g) => (
                <div key={g.label} className={`flex items-center justify-between rounded-lg ${g.bg} px-4 py-3`}>
                  <span className="text-sm font-medium text-gray-700">{g.label}</span>
                  <span className={`rounded-full ${g.pill} px-2 py-0.5 text-xs font-semibold`}>{g.status}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-900">Today's Summary</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Entries</span>
                <span className="font-medium">{todayCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Currently Inside</span>
                <span className="font-medium">{inside.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Checked Out</span>
                <span className="font-medium">{todayCount - inside.length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
