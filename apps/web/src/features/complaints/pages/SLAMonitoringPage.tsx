import { Card } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { complaintsApi } from "@/api/complaints.api";
import { useScope } from "@/app/scope/ScopeProvider";

const STATUS_COLORS: Record<string, string> = {
  OPEN:        "bg-blue-100 text-blue-700",
  ASSIGNED:    "bg-purple-100 text-purple-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED:    "bg-green-100 text-green-700",
  CLOSED:      "bg-gray-100 text-gray-600",
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH:     "bg-orange-100 text-orange-700",
  MEDIUM:   "bg-yellow-100 text-yellow-700",
  LOW:      "bg-gray-100 text-gray-600",
};

export function SLAMonitoringPage() {
  const { queryParams } = useScope();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search,      setSearch]      = useState("");
  const [unit,        setUnit]        = useState("");
  const [status,      setStatus]      = useState("");
  const [priority,    setPriority]    = useState("");
  const [escalated,   setEscalated]   = useState("");
  const [slaStatus,   setSlaStatus]   = useState(searchParams.get("sla_status") ?? "");
  const [assigned,    setAssigned]    = useState("");
  const [catId,       setCatId]       = useState("");
  const [fetchError, setFetchError]   = useState<string | null>(null);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    const priorityParam = searchParams.get("priority");
    const slaBreachParam = searchParams.get("sla_breach");
    const escalatedParam = searchParams.get("escalated");

    setStatus(statusParam ? statusParam.toUpperCase() : "");
    setPriority(priorityParam ? priorityParam.toUpperCase() : "");
    if (slaBreachParam === "true") {
      setSlaStatus("breached");
    }
    setEscalated(escalatedParam ?? "");
  }, [searchParams]);

  const { data: catRaw } = useQuery({
    queryKey: ["complaint-categories-sla"],
    queryFn: async () => {
      const res = await complaintsApi.getCategories({ ...queryParams });
      return res?.data ?? res;
    },
  });
  const categories: Record<string, unknown>[] = Array.isArray(catRaw)
    ? catRaw
    : (catRaw as Record<string, unknown[]> | null)?.data ?? [];

  const { data: raw, isLoading } = useQuery({
    queryKey: ["sla-monitoring", queryParams, status, priority, catId, assigned, search, unit, slaStatus],
    queryFn: async () => {
      const res = await complaintsApi.getSlaMonitoring({
        ...queryParams,
        page_size:    200,
        status:       status   || undefined,
        priority:     priority || undefined,
        cat_id:       catId    || undefined,
        unit_number:  unit     || undefined,
        search:       search   || undefined,
      });
      return res?.data ?? res;
    },
    retry: false,
    enabled: Boolean(queryParams?.society_id),
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err as Error)?.message
        ?? "Unable to load SLA complaints";
      setFetchError(message);
    },
    onSuccess: () => setFetchError(null),
  });

  let rows: Record<string, unknown>[] = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const meta = (raw as Record<string, unknown>)?.meta as
    Record<string, number> | undefined;

  const selectedCategoryName = categories.find(c => String(c.id ?? "") === catId)?.category_name;
  const normalizedSearch = search.trim().toLowerCase();
  const normalizedUnit = unit.trim().toLowerCase();

  if (catId && selectedCategoryName) {
    rows = rows.filter(r =>
      String(r.category_name ?? "").toLowerCase() ===
      String(selectedCategoryName).toLowerCase()
    );
  }
  if (normalizedSearch) {
    rows = rows.filter(r => {
      const values = [
        r.ticket_number,
        r.title,
        r.category_name,
        r.unit_number,
        r.block_name,
      ];
      return values.some(value =>
        String(value ?? "").toLowerCase().includes(normalizedSearch)
      );
    });
  }
  if (normalizedUnit) {
    rows = rows.filter(r =>
      String(r.unit_number ?? "").toLowerCase().includes(normalizedUnit)
    );
  }
  if (status) {
    rows = rows.filter(r =>
      String(r.status ?? "").toLowerCase() === String(status).toLowerCase()
    );
  }
  if (priority) {
    rows = rows.filter(r =>
      String(r.priority ?? "").toLowerCase() === String(priority).toLowerCase()
    );
  }
  if (assigned === "unassigned") rows = rows.filter((r) => !r.assigned_to);
  if (assigned === "assigned")   rows = rows.filter((r) => !!r.assigned_to);

  if (slaStatus === "breached") {
    rows = rows.filter((r) => r.sla_breach === true);
  } else if (slaStatus === "at_risk") {
    rows = rows.filter((r) => {
      if (r.sla_breach) return false;
      const elapsed = r.created_at
        ? (Date.now() - new Date(String(r.created_at)).getTime()) / 3600000
        : 0;
      const slaHours = Number(r.sla_hours ?? 48);
      const pct = (elapsed / slaHours) * 100;
      const st = String(r.status ?? "").toLowerCase();
      return pct >= 75 && st !== "resolved" && st !== "closed";
    });
  } else if (slaStatus === "on_track") {
    rows = rows.filter((r) => {
      if (r.sla_breach) return false;
      const elapsed = r.created_at
        ? (Date.now() - new Date(String(r.created_at)).getTime()) / 3600000
        : 0;
      const slaHours = Number(r.sla_hours ?? 48);
      const pct = (elapsed / slaHours) * 100;
      return pct < 75;
    });
  }

  const breachedRows  = rows.filter(r => r.sla_breach === true);
  const atRiskRows    = rows.filter(r => {
    if (r.sla_breach) return false;
    const hoursElapsed = Number(r.hours_elapsed ?? 0);
    const slaHours     = Number(r.sla_hours ?? r.category_sla_hours ?? 48);
    const pct = (hoursElapsed / slaHours) * 100;
    return pct >= 75 && String(r.status) !== 'RESOLVED'
      && String(r.status) !== 'CLOSED';
  });
  const onTrackRows   = rows.filter(r => {
    if (r.sla_breach) return false;
    const hoursElapsed = Number(r.hours_elapsed ?? 0);
    const slaHours     = Number(r.sla_hours ?? r.category_sla_hours ?? 48);
    const pct = (hoursElapsed / slaHours) * 100;
    return pct < 75;
  });

  const formatDate = (d: unknown) =>
    d ? new Date(String(d)).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }) : "—";

  const formatHours = (h: unknown) => {
    const hours = Math.abs(Number(h ?? 0));
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`;
  };

  const getSlaBar = (row: Record<string, unknown>) => {
    const elapsed = Number(row.hours_elapsed ?? 0);
    const slaHours = Number(row.sla_hours ?? row.category_sla_hours ?? 48);
    const pct = Math.min((elapsed / slaHours) * 100, 100);
    const color = row.sla_breach
      ? "bg-red-500"
      : pct >= 75 ? "bg-amber-400" : "bg-green-400";
    return { pct, color };
  };

  const summaryCards = [
    {
      label: "SLA Breached",
      value: breachedRows.length,
      icon: AlertTriangle,
      color: "bg-red-100 text-red-700",
      border: "border-red-200"
    },
    {
      label: "At Risk (>75%)",
      value: atRiskRows.length,
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
      border: "border-amber-200"
    },
    {
      label: "On Track",
      value: onTrackRows.length,
      icon: CheckCircle,
      color: "bg-green-100 text-green-700",
      border: "border-green-200"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Complaints / SLA Monitoring</p>
        <h1 className="text-2xl font-bold text-gray-900">SLA Monitoring</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track complaints against SLA deadlines — breached complaints shown first
        </p>
      </div>

      {/* Filter Row 1 */}
      <div className="flex flex-wrap gap-3">
        <input
          className="min-w-[220px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search ticket, title, category, unit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          className="min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search unit number"
          value={unit}
          onChange={e => setUnit(e.target.value)}
        />
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
          value={priority}
          onChange={e => setPriority(e.target.value)}
        >
          <option value="">All Priority</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
          value={slaStatus}
          onChange={e => setSlaStatus(e.target.value)}
        >
          <option value="">All SLA Status</option>
          <option value="breached">SLA Breached</option>
          <option value="at_risk">At Risk (&gt;75%)</option>
          <option value="on_track">On Track</option>
        </select>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
          value={assigned}
          onChange={e => setAssigned(e.target.value)}
        >
          <option value="">All Assigned</option>
          <option value="unassigned">Unassigned</option>
          <option value="assigned">Assigned</option>
        </select>
      </div>

      {/* Filter Row 2 */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          value={catId}
          onChange={e => setCatId(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={String(c.id ?? "")} value={String(c.id ?? "")}>
              {String(c.category_name ?? "")}
            </option>
          ))}
        </select>
        {(search || unit || status || priority || catId || assigned || slaStatus) && (
          <button
            onClick={() => {
              setSearch(""); setUnit(""); setStatus(""); setPriority("");
              setCatId(""); setAssigned(""); setSlaStatus("");
            }}
            className="text-sm text-gray-400 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
        <div className="ml-auto text-xs text-gray-400">
          {rows.length} complaints shown
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map(card => (
          <Card key={card.label}
            className={`p-5 border ${card.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {isLoading ? "..." : card.value}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${card.color}`}>
                <card.icon size={22} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                "TICKET","TITLE","CATEGORY","PRIORITY","STATUS",
                "UNIT","ASSIGNED TO","CREATED","SLA DUE",
                "SLA PROGRESS","OVERDUE BY","ACTION"
              ].map(h => (
                <th key={h}
                  className="px-3 py-3 text-left text-xs font-semibold
                             uppercase tracking-wider text-gray-500 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={12}
                  className="px-4 py-10 text-center text-gray-400">
                  Loading SLA data...
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td colSpan={12}
                  className="px-4 py-10 text-center text-red-500">
                  {fetchError}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={12}
                  className="px-4 py-10 text-center text-gray-400">
                  No complaints found
                </td>
              </tr>
            ) : rows.map(row => {
              const isBreach = row.sla_breach === true;
              const { pct, color } = getSlaBar(row);
              const status   = String(row.status ?? "").toUpperCase();
              const priority = String(row.priority ?? "").toUpperCase();
              const isResolved = status === "RESOLVED" || status === "CLOSED";

              return (
                <tr
                  key={String(row.id ?? "")}
                  className={`cursor-pointer transition-colors
                    ${isBreach
                      ? "bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100"
                      : "hover:bg-gray-50"
                    }`}
                  onClick={() => navigate(
                    `/complaints/${String(row.id ?? "")}`
                  )}
                >
                  <td className="px-3 py-3 font-mono text-xs
                                 text-blue-600 font-semibold whitespace-nowrap">
                    {String(row.ticket_number ?? "")}
                  </td>
                  <td className="px-3 py-3 font-medium text-gray-900
                                 max-w-[140px] truncate">
                    {String(row.title ?? "")}
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5
                                     text-xs text-blue-700">
                      {String(row.category_name ?? "—")}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs
                      font-semibold ${PRIORITY_COLORS[priority]
                        ?? "bg-gray-100 text-gray-600"}`}>
                      {priority}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs
                      font-semibold ${STATUS_COLORS[status]
                        ?? "bg-gray-100 text-gray-600"}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs">
                    {String(row.unit_number ?? "—")}
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs">
                    {String(row.assigned_to_name ?? "Unassigned")}
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap
                                 font-medium text-gray-700">
                    {formatDate(row.sla_due)}
                  </td>
                  <td className="px-3 py-3 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${color}
                            transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 shrink-0">
                        {Math.round(pct)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap">
                    {isBreach ? (
                      <span className="font-bold text-red-600">
                        +{formatHours(row.hours_overdue)} overdue
                      </span>
                    ) : isResolved ? (
                      <span className="text-green-600 font-medium">
                        ✅ Resolved
                      </span>
                    ) : (
                      <span className="text-gray-400">Within SLA</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/complaints/${String(row.id ?? "")}`);
                      }}
                      className="rounded px-2 py-1 text-xs border
                                 border-gray-300 text-gray-600
                                 hover:bg-gray-100"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && rows.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2
                          text-xs text-gray-400">
            {breachedRows.length} breached •
            {atRiskRows.length} at risk •
            {onTrackRows.length} on track •
            {rows.length} total
          </div>
        )}
      </div>
    </div>
  );
}
