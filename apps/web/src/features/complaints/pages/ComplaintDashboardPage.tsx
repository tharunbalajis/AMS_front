import { Card, StatusBadge } from "@ams/ui";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, X, ExternalLink, ImageIcon, VideoIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { complaintsApi } from "@/api/complaints.api";
import { useScope } from "@/app/scope/ScopeProvider";

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH:     "bg-orange-100 text-orange-700",
  MEDIUM:   "bg-yellow-100 text-yellow-700",
  LOW:      "bg-gray-100 text-gray-600",
};

export function ComplaintDashboardPage() {
  const { queryParams } = useScope();
  const navigate = useNavigate();

  const { data: dash, isLoading: dashLoading } = useQuery({
    queryKey: ["complaints-dashboard-agg", queryParams],
    queryFn: async () => {
      const res = await complaintsApi.getDashboard({ ...queryParams });
      return res?.data ?? res;
    },
    retry: false,
  });

  const { data: heatmapRaw } = useQuery({
    queryKey: ["complaints-heatmap", queryParams],
    queryFn: async () => {
      const res = await complaintsApi.getHeatmap({ ...queryParams });
      return res?.data ?? res;
    },
    retry: false,
  });

  const isLoading = dashLoading;

  const heatmapRows: Record<string, any>[] = Array.isArray(heatmapRaw)
    ? heatmapRaw
    : Array.isArray((heatmapRaw as Record<string, any> | null)?.data)
    ? (heatmapRaw as Record<string, any[]>).data
    : [];

  const blockMap: Record<string, Record<string, Record<string, any>[]>> = {};
  heatmapRows.forEach((row) => {
    const block = String(row.block_name ?? "Unknown");
    const floor = String(row.floor ?? "1");
    if (!blockMap[block]) blockMap[block] = {};
    if (!blockMap[block][floor]) blockMap[block][floor] = [];
    blockMap[block][floor].push(row);
  });
  const blockNames = Object.keys(blockMap).sort();

  const [popupFloor, setPopupFloor] = useState<{
    block: string;
    floor: string;
    complaints: Record<string, any>[];
  } | null>(null);
  useEffect(() => {
    if (!popupFloor) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPopupFloor(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [popupFloor]);

  const d = dash as Record<string, unknown> | undefined;
  const byStatus = d?.by_status as Record<string, number> | undefined ?? {};

  const getCount = (key: string) =>
    byStatus[key] ?? byStatus[key.toLowerCase()] ?? 0;

  const totalOpen = getCount("OPEN") + getCount("ASSIGNED") + getCount("IN_PROGRESS");
  const critical  = Number(d?.critical_count ?? 0);
  const slaBreached = Number(d?.sla_breach_count ?? 0);
  const totalResolved = getCount("RESOLVED");

  const kpis = [
    { label: "Total Open",     value: totalOpen,     icon: AlertCircle,   color: "bg-blue-100 text-blue-700",   nav: () => navigate("/complaints?status=OPEN") },
    { label: "Critical",       value: critical,      icon: AlertTriangle, color: "bg-red-100 text-red-700",    nav: () => navigate("/complaints?priority=CRITICAL") },
    { label: "SLA Breached",   value: slaBreached,   icon: Clock,         color: "bg-amber-100 text-amber-700", nav: () => navigate("/complaints?sla_breach=true") },
    { label: "Resolved",       value: totalResolved, icon: CheckCircle,   color: "bg-green-100 text-green-700", nav: () => navigate("/complaints?status=RESOLVED") },
  ];

  const pieData = [
    { name: "Open",        value: getCount("OPEN"),        color: "#3b82f6" },
    { name: "Assigned",    value: getCount("ASSIGNED"),    color: "#8b5cf6" },
    { name: "In Progress", value: getCount("IN_PROGRESS"), color: "#f59e0b" },
    { name: "Resolved",    value: getCount("RESOLVED"),    color: "#10b981" },
    { name: "Closed",      value: getCount("CLOSED"),      color: "#6b7280" },
  ].filter(p => p.value > 0);

  const topCategories = (d?.top_categories as { category_name: string; count: number }[]) ?? [];
  const categoryData = topCategories.map(c => ({ name: c.category_name, count: c.count }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Complaints / Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-900">Complaints Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Live overview — click any card to filter</p>
      </div>

      {/* KPI Cards — all clickable */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={kpi.nav}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                {isLoading
                  ? <div className="mt-2 h-8 w-12 bg-gray-200 animate-pulse rounded" />
                  : <p className="mt-1 text-3xl font-bold text-gray-900">{kpi.value}</p>
                }
              </div>
              <div className={`rounded-lg p-3 ${kpi.color}`}><kpi.icon size={22} /></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Status Distribution</h2>
          <div className="mt-4 h-64">
            {isLoading ? (
              <div className="h-full w-full bg-gray-100 animate-pulse rounded" />
            ) : pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-400 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">By Category</h2>
          <div className="mt-4 h-64">
            {isLoading ? (
              <div className="h-full w-full bg-gray-100 animate-pulse rounded" />
            ) : categoryData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-400 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* ── Complaint Hotspots Heatmap ── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Complaint Hotspots</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Active (non-resolved) complaints by block and floor — click any floor to view
          </p>
        </div>

        {dashLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : blockNames.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12
                          text-center text-sm text-gray-400">
            No active complaints — all clear 🎉
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {blockNames.map((block) => {
              const floors = blockMap[block];
              const blockTotal = Object.values(floors).reduce((s, a) => s + a.length, 0);
              const floorKeys = Object.keys(floors).sort((a, b) => Number(b) - Number(a));

              return (
                <div key={block}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm
                             hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-gray-800 tracking-wide">
                      Block {block}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs
                                     font-semibold text-blue-600 border border-blue-100">
                      {blockTotal} complaint{blockTotal !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {floorKeys.map((floor) => {
                      const count = floors[floor].length;
                      const bg =
                        count >= 5 ? "#fecaca" :
                        count >= 3 ? "#fed7aa" :
                        count >= 2 ? "#fef08a" :
                                     "#bbf7d0";
                      const text =
                        count >= 5 ? "#7f1d1d" :
                        count >= 3 ? "#7c2d12" :
                        count >= 2 ? "#713f12" :
                                     "#166534";
                      const border =
                        count >= 5 ? "#fca5a5" :
                        count >= 3 ? "#fdba74" :
                        count >= 2 ? "#fde047" :
                                     "#86efac";

                      return (
                        <button
                          key={floor}
                          onClick={() => setPopupFloor({
                            block, floor,
                            complaints: floors[floor]
                          })}
                          style={{ background: bg, color: text, borderColor: border }}
                          className="rounded-xl border-2 px-3 pt-2 pb-2 min-w-[64px]
                                     text-center transition-opacity hover:opacity-75
                                     cursor-pointer"
                        >
                          <div className="text-[10px] font-medium opacity-80 leading-tight">
                            Floor {floor}
                          </div>
                          <div className="text-xl font-bold leading-tight mt-0.5">
                            {count}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Floor Detail Popup ── */}
      {popupFloor && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50,
                      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div
            style={{ position: "absolute", inset: 0,
                     background: "rgba(0,0,0,0.35)", cursor: "pointer" }}
            onClick={() => setPopupFloor(null)}
          />

          <div style={{ position: "relative", zIndex: 10, width: "100%",
                        maxWidth: "680px", background: "white",
                        borderRadius: "20px 20px 0 0", maxHeight: "78vh",
                        display: "flex", flexDirection: "column",
                        boxShadow: "0 -4px 32px rgba(0,0,0,0.12)" }}>

            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>

            <div className="flex items-center justify-between px-5 py-3
                            border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Block {popupFloor.block} — Floor {popupFloor.floor}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {popupFloor.complaints.length} active complaint
                  {popupFloor.complaints.length !== 1 ? "s" : ""}
                  {" "}(open / in-progress)
                </p>
              </div>
              <button
                onClick={() => setPopupFloor(null)}
                className="rounded-full p-1.5 hover:bg-gray-100 text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {popupFloor.complaints.map((c) => {
                const p = String(c.priority ?? "").toUpperCase();
                const pColor =
                  p === "CRITICAL" ? "bg-red-100 text-red-700" :
                  p === "HIGH"     ? "bg-orange-100 text-orange-700" :
                  p === "MEDIUM"   ? "bg-yellow-100 text-yellow-800" :
                                     "bg-gray-100 text-gray-600";
                const sColor =
                  String(c.status) === "OPEN"        ? "bg-blue-50 text-blue-700" :
                  String(c.status) === "IN_PROGRESS" ? "bg-amber-50 text-amber-700" :
                                                       "bg-purple-50 text-purple-700";
                const date = c.created_at
                  ? new Date(String(c.created_at)).toLocaleDateString("en-IN",
                      { day: "2-digit", month: "short", year: "numeric" })
                  : "—";

                const mediaItems = Array.isArray(c.media) ? c.media as Record<string,string>[] : [];
                const images = mediaItems.filter(m => String(m.type ?? "").startsWith("image"));
                const videos = mediaItems.filter(m => String(m.type ?? "").startsWith("video"));

                return (
                  <div key={String(c.id ?? "")}
                    className="px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-mono text-xs font-bold text-blue-600">
                        {String(c.ticket_number ?? "")}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pColor}`}>
                        {p}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sColor}`}>
                        {String(c.status ?? "")}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">{date}</span>
                    </div>

                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      {String(c.title ?? "")}
                    </p>

                    {c.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {String(c.description)}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                      <span>
                        <span className="font-medium text-gray-700">Unit:</span>{" "}
                        {String(c.unit_number ?? "—")}
                      </span>
                      <span>
                        <span className="font-medium text-gray-700">Block:</span>{" "}
                        {String(c.block_name ?? "—")}
                      </span>
                      <span>
                        <span className="font-medium text-gray-700">Category:</span>{" "}
                        {String(c.category_name ?? "—")}
                      </span>
                      <span>
                        <span className="font-medium text-gray-700">Raised by:</span>{" "}
                        {String(c.raised_by_name ?? "—")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {images.length > 0 ? (
                          <span className="flex items-center gap-1 text-xs text-blue-600
                                           bg-blue-50 rounded-full px-2 py-0.5">
                            <ImageIcon size={11} />
                            {images.length} photo{images.length > 1 ? "s" : ""}
                          </span>
                        ) : null}
                        {videos.length > 0 ? (
                          <span className="flex items-center gap-1 text-xs text-purple-600
                                           bg-purple-50 rounded-full px-2 py-0.5">
                            <VideoIcon size={11} />
                            {videos.length} video{videos.length > 1 ? "s" : ""}
                          </span>
                        ) : null}
                        {mediaItems.length === 0 && (
                          <span className="text-xs text-gray-300">No attachments</span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setPopupFloor(null);
                          navigate(`/complaints/${String(c.id ?? "")}`);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-blue-200
                                   bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600
                                   hover:bg-blue-100 transition-colors shrink-0"
                      >
                        <ExternalLink size={11} />
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  const b = popupFloor.block;
                  const f = popupFloor.floor;
                  setPopupFloor(null);
                  navigate(`/complaints?block_name=${encodeURIComponent(b)}&floor=${encodeURIComponent(f)}`);
                }}
                className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold
                           text-white hover:bg-gray-700 transition-colors"
              >
                View all complaints for Block {popupFloor.block}, Floor {popupFloor.floor} →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
