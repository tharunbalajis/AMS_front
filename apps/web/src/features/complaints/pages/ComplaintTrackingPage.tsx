import { Button, SearchBox, Select, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { complaintsApi } from "@/api/complaints.api";
import { useScope } from "@/app/scope/ScopeProvider";

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH:     "bg-orange-100 text-orange-700",
  MEDIUM:   "bg-yellow-100 text-yellow-700",
  LOW:      "bg-gray-100 text-gray-600",
};

export function ComplaintTrackingPage() {
  const { queryParams, society } = useScope();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("");
  const [priority,    setPriority]    = useState("");
  const [assigned,    setAssigned]    = useState("");
  const [catId,       setCatId]       = useState("");
  const [unitSearch,  setUnitSearch]  = useState("");
  const [createdDate, setCreatedDate] = useState("");
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [blockFilter, setBlockFilter] = useState(searchParams.get("block_name") ?? "");
  const [floorFilter, setFloorFilter] = useState(searchParams.get("floor") ?? "");

  // Pre-populate filters from URL query params (dashboard card clicks)
  useEffect(() => {
    const statusParam = searchParams.get("status");
    const priorityParam = searchParams.get("priority");
    const slaBreachParam = searchParams.get("sla_breach");
    
    if (statusParam) setStatus(statusParam.toUpperCase());
    if (priorityParam) setPriority(priorityParam.toUpperCase());
    if (slaBreachParam === "true") {
      // Handle SLA breach filter - this would need backend support or client-side logic
      // For now, just note it could be added later
    }
  }, [searchParams]);

  // Categories for the dropdown filter
  const societyId = queryParams?.society_id ?? society?.society_id ?? 1;
  const validSocietyId = typeof societyId === 'number' ? societyId : Number(societyId);

  const { data: catRaw } = useQuery({
    queryKey: ["complaint-categories-filter", validSocietyId],
    queryFn: async () => {
      const res = await complaintsApi.getCategories({ society_id: validSocietyId });
      return res?.data ?? res;
    },
    enabled: Boolean(validSocietyId),
  });
  const categories: Record<string, unknown>[] = Array.isArray(catRaw)
    ? catRaw
    : (catRaw as Record<string, unknown[]> | null)?.data ?? [];

  // Complaints with server-side filters
  const { data: raw, isLoading } = useQuery({
    queryKey: ["complaints-tracking", validSocietyId, status, priority, catId, unitSearch, createdDate, search, blockFilter, floorFilter],
    queryFn: () => complaintsApi.getAll({
      society_id: validSocietyId,
      status:       status       || undefined,
      priority:     priority     || undefined,
      cat_id:       catId        || undefined,
      unit_number:  unitSearch   || undefined,
      created_date: createdDate  || undefined,
      search:       search       || undefined,
      block_name:   blockFilter  || undefined,
      floor:        floorFilter  || undefined,
      page: 1,
      page_size: 100,
    }),
    retry: false,
    enabled: Boolean(validSocietyId),
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err as Error)?.message
        ?? "Unable to load complaints";
      setFetchError(message);
    },
    onSuccess: () => setFetchError(null),
  });

  let rows = normalizeList<Record<string, unknown>>(raw?.data ?? raw);

  // Client-side assigned filter only
  if (assigned === "unassigned") rows = rows.filter((r) => !r.assigned_to && !r.assigned_to_name);
  if (assigned === "assigned")   rows = rows.filter((r) => !!r.assigned_to || !!r.assigned_to_name);

  const handleExport = () => {
    const csv = [
      ["Ticket", "Title", "Category", "Priority", "Status", "Unit", "Assigned", "Created", "SLA Due"],
      ...rows.map(r => [
        String(r.ticket_number ?? ""),
        String(r.title ?? ""),
        String(r.category_name ?? ""),
        String(r.priority ?? ""),
        String(r.status ?? ""),
        String(r.unit_number ?? ""),
        String(r.assigned_to_name ?? "Unassigned"),
        String(r.created_at ?? ""),
        String(r.sla_due ?? ""),
      ])
    ].map(row => row.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "complaints.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Complaints / Complaint Tracking</p>
          <h1 className="text-2xl font-bold text-gray-900">Complaint Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} complaints</p>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          <Download size={15} className="mr-1" />Export
        </Button>
      </div>

      {/* Filter Row 1: Search + Status + Priority + Assigned */}
      <div className="flex flex-wrap gap-3">
        <SearchBox
          className="min-w-[240px] flex-1"
          placeholder="Search complaint title, ticket, categ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </Select>
        <Select className="w-44" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All Priority</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </Select>
        <Select className="w-44" value={assigned} onChange={(e) => setAssigned(e.target.value)}>
          <option value="">All Assigned</option>
          <option value="unassigned">Unassigned</option>
          <option value="assigned">Assigned</option>
        </Select>
      </div>

      {/* Filter Row 2: Categories + Unit number + Created date */}
      <div className="flex flex-wrap gap-3">
        <Select className="w-52" value={catId} onChange={(e) => setCatId(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={String(c.id ?? "")} value={String(c.id ?? "")}>
              {String(c.category_name ?? "")}
            </option>
          ))}
        </Select>
        <input
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
          placeholder="Unit number"
          value={unitSearch}
          onChange={(e) => setUnitSearch(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">Created date (dd/mm/yyyy)</label>
          <input
            type="date"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={createdDate}
            onChange={(e) => setCreatedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Sort button */}
      <div>
        <button className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
          <ArrowUpDown size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["TICKET","TITLE","CATEGORY","PRIORITY","STATUS","UNIT","ASSIGNED","CREATED","SLA DUE","ACTION"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : fetchError ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-red-500">{fetchError}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No records found</td></tr>
            ) : rows.map((row) => (
              <tr key={String(row.id ?? "")} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/complaints/${String(row.id ?? "")}`)}
                    className="font-mono text-xs font-medium text-blue-700 hover:underline"
                  >
                    {String(row.ticket_number ?? "")}
                  </button>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{String(row.title ?? "")}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {String(row.category_name ?? "—")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[String(row.priority ?? "")] ?? "bg-gray-100 text-gray-600"}`}>
                    {String(row.priority ?? "")}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge value={row.status} /></td>
                <td className="px-4 py-3 text-gray-600">{String(row.unit_number ?? "—")}</td>
                <td className="px-4 py-3 text-gray-600">{String(row.assigned_to_name ?? "Unassigned")}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{String(row.created_at ?? "")}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{String(row.sla_due ?? "—")}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/complaints/${String(row.id ?? "")}`)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >⋮</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && rows.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
            Showing {rows.length} complaints
          </div>
        )}
      </div>
    </div>
  );
}
