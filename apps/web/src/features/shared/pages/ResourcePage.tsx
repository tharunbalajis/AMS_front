import type { ResourceRecord } from "@ams/api-types";
import { Button, Card, DataTable, SearchBox, Select, StatusBadge } from "@ams/ui";
import { getRecordLabel } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Filter, Loader2, Plus, RefreshCw, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { resourceApi } from "../../../app/api/client";
import { useScope } from "../../../app/scope/ScopeProvider";
import type { ModuleRoute } from "../../registry";

const chartColors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#64748b"];

// ─── Generic Add Record Modal ─────────────────────────────────────────────────
function AddRecordModal({ module, onClose, onSaved }: { module: ModuleRoute; onClose: () => void; onSaved: () => void }) {
  const api = resourceApi(module.endpoint ?? `/${module.slug}`);
  const [fields, setFields] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => api.create(fields as unknown as ResourceRecord),
    onSuccess: () => { toast.success(`${module.label} record created`); onSaved(); onClose(); },
    onError: (err: Error) => toast.error(err.message || "Failed to create record")
  });

  const formFields = getFormFields(module.slug, module.columns);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">Add {module.label}</h2>
            <p className="text-xs text-gray-500">Fill in the required fields to create a new record</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-6">
          {formFields.map(field => (
            <label key={field.key} className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700 capitalize">{field.label}</span>
              {field.type === "select" ? (
                <select
                  value={fields[field.key] ?? ""}
                  onChange={e => setFields(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={field.type ?? "text"}
                  value={fields[field.key] ?? ""}
                  onChange={e => setFields(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add Record
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────
function ImportModal({ module, onClose, onSaved }: { module: ModuleRoute; onClose: () => void; onSaved: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const rows = text.trim().split("\n").slice(0, 6).map(row => row.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
      setPreview(rows);
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    try {
      await new Promise(r => setTimeout(r, 1200)); // simulate
      toast.success(`${module.label} import initiated — ${file.name}`);
      onSaved();
      onClose();
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">Import {module.label}</h2>
            <p className="text-xs text-gray-500">Upload CSV or Excel file with {module.label.toLowerCase()} data</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-6">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-10 text-center hover:border-blue-400 hover:bg-blue-50/30 transition"
          >
            <Upload size={32} className="text-gray-300" />
            <div>
              <p className="text-sm font-medium text-gray-700">Click to upload or drag & drop</p>
              <p className="text-xs text-gray-400">CSV, Excel (.xlsx) — max 10MB</p>
            </div>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {file && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{file.name}</span>}
          </div>

          {preview.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview (first 5 rows)</p>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead><tr className="bg-gray-50">{preview[0]?.map((h, i) => <th key={i} className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">{h}</th>)}</tr></thead>
                  <tbody>{preview.slice(1).map((row, i) => <tr key={i} className={i % 2 ? "bg-gray-50/50" : ""}>{row.map((cell, j) => <td key={j} className="border-b border-gray-100 px-3 py-1.5 text-gray-600">{cell}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between border-t border-gray-200 px-6 py-4">
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(module.columns.join(",") + "\n")}`}
            download={`${module.slug}-template.csv`}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
          >
            <Download size={14} /> Download Template
          </a>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button
              type="button"
              disabled={!file || importing}
              onClick={handleImport}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResourcePage({ module }: { module: ModuleRoute }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const { queryParams } = useScope();
  const qc = useQueryClient();
  const api = useState(() => resourceApi(module.endpoint ?? `/${module.slug}`))[0];

  const query = useQuery({
    queryKey: ["resource", module.slug, module.endpoint, queryParams, search, status],
    queryFn: () => api.list(buildParams(module.slug, module.endpoint, queryParams, search, status)),
    enabled: Boolean(module.endpoint)
  });

  const rows = query.data ?? [];
  const activeCount = rows.filter((row) => isActive(row)).length;
  const issueCount = rows.filter((row) => isIssue(row)).length;
  const amountTotal = rows.reduce((sum, row) => sum + numericValue(row.total_amount ?? row.amount ?? row.paid_amount ?? row.balance_due), 0);
  const columns = module.columns.map((key) => ({
    key,
    header: key.replaceAll("_", " "),
    render: (row: ResourceRecord) => key.includes("amount") ? formatAmount(row[key]) : key.includes("date") || key.includes("_at") ? formatDate(row[key]) : key.includes("status") || key.includes("active") ? <StatusBadge value={row[key]} /> : String(row[key] ?? "-")
  }));
  const statusChart = buildStatusChart(rows);
  const categoryChart = buildCategoryChart(rows, module.columns);

  function handleExport() {
    if (!rows.length) { toast.error("No data to export"); return; }
    const headers = module.columns.join(",");
    const csvRows = rows.map(row => module.columns.map(k => `"${String(row[k] ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [headers, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module.slug}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} records`);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={["AMS", module.label]} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">{module.label}</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">{module.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => query.refetch()}><RefreshCw size={16} /> Refresh</Button>
          <Button variant="secondary" onClick={handleExport}><Download size={16} /> Export</Button>
          <Button variant="secondary" onClick={() => setShowImport(true)}><Upload size={16} /> Import</Button>
          <Button onClick={() => setShowAdd(true)}><Plus size={16} /> New {module.label.split(" ")[0]}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Loaded Records" value={rows.length} hint="from backend" tone="blue" />
        <MetricCard label="Active Items" value={activeCount} hint="healthy records" tone="green" />
        <MetricCard label="Needs Attention" value={issueCount} hint="pending or overdue" tone="amber" />
        <MetricCard label="Amount Tracked" value={amountTotal ? formatAmount(amountTotal) : "₹0"} hint="available total" tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Status Analytics</h2>
              <p className="mt-1 text-sm text-gray-500">Live distribution from fetched records.</p>
            </div>
            <StatusBadge value={query.isError ? "WARNING" : "ACTIVE"} />
          </div>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={70} outerRadius={106} paddingAngle={3}>
                  {statusChart.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Module Breakdown</h2>
          <p className="mt-1 text-sm text-gray-500">Top categories, blocks, types, or statuses.</p>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_190px_190px_auto] dark:border-gray-800 dark:bg-gray-900">
        <SearchBox placeholder={`Search ${module.label.toLowerCase()}`} value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select><option>Column visibility</option><option>All columns</option></Select>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {statusOptions(module.slug).map((option) => <option key={option} value={option}>{option}</option>)}
        </Select>
        <Button variant="secondary"><Filter size={16} /> Filters</Button>
      </div>

      <DataTable<ResourceRecord>
        title={`${module.label} Register`}
        rows={rows}
        columns={[{ key: "name", header: "record", render: getRecordLabel }, ...columns]}
        isLoading={query.isLoading}
        emptyText={query.isError ? "Unable to load this module from the backend" : "No records found for the selected filters"}
      />

      {/* Modals */}
      {showAdd && (
        <AddRecordModal
          module={module}
          onClose={() => setShowAdd(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["resource", module.slug] })}
        />
      )}
      {showImport && (
        <ImportModal
          module={module}
          onClose={() => setShowImport(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["resource", module.slug] })}
        />
      )}
    </div>
  );
}

function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      {items.map((item, index) => (
        <span key={item} className={index === items.length - 1 ? "font-semibold text-gray-800 dark:text-gray-200" : ""}>
          {item}{index < items.length - 1 ? <span className="mx-2 text-gray-300">/</span> : null}
        </span>
      ))}
    </div>
  );
}

function MetricCard({ label, value, hint, tone }: { label: string; value: string | number; hint: string; tone: "blue" | "green" | "amber" | "red" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100"
  };
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm opacity-80">{hint}</p>
    </div>
  );
}

function getFormFields(slug: string, columns: string[]): Array<{ key: string; label: string; type?: string; options?: string[] }> {
  if (slug === "residents" || slug.startsWith("residents/")) {
    return [
      { key: "full_name", label: "Full Name" },
      { key: "mobile_primary", label: "Mobile" },
      { key: "email", label: "Email", type: "email" },
      { key: "resident_type", label: "Resident Type", type: "select", options: ["OWNER", "TENANT"] },
      { key: "unit_number", label: "Unit Number" }
    ];
  }
  if (slug === "staff") {
    return [
      { key: "name", label: "Name" },
      { key: "role", label: "Role", type: "select", options: ["SECURITY", "MAINTENANCE", "CLEANING", "PLUMBER", "ELECTRICIAN"] },
      { key: "mobile", label: "Mobile" }
    ];
  }
  if (slug === "amenities") {
    return [
      { key: "name", label: "Amenity Name" },
      { key: "description", label: "Description" }
    ];
  }
  if (slug === "assets") {
    return [
      { key: "asset_name", label: "Asset Name" },
      { key: "asset_type", label: "Asset Type", type: "select", options: ["ELECTRICAL", "MECHANICAL", "CIVIL", "IT", "VEHICLE", "OTHER"] },
      { key: "location", label: "Location" }
    ];
  }
  if (slug === "notices") {
    return [
      { key: "title", label: "Title" },
      { key: "notice_type", label: "Notice Type", type: "select", options: ["GENERAL", "URGENT", "MAINTENANCE", "MEETING", "FESTIVAL"] },
      { key: "content", label: "Content" }
    ];
  }
  if (slug === "meetings") {
    return [
      { key: "title", label: "Meeting Title" },
      { key: "meeting_date", label: "Meeting Date", type: "date" },
      { key: "venue", label: "Venue" }
    ];
  }
  // Default: generate from columns
  return columns.slice(0, 4).map(key => ({ key, label: key.replaceAll("_", " ") }));
}

function buildParams(slug: string, endpoint: string | undefined, scope: { society_id?: number; block_id?: number }, search: string, status: string) {
  const society_id = scope.society_id ?? 1;
  if (endpoint === "/visitors") return { page: 1, page_size: 25, visitor_name: search || undefined, status: status || undefined };
  if (endpoint === "/visitor-passes") return { page: 1, page_size: 25 };
  if (endpoint === "/delivery-entries") return { page: 1, page_size: 25, status: status || undefined };
  if (endpoint === "/sos-alerts") return { page: 1, page_size: 25, status: status || undefined };
  if (endpoint === "/complaints") return { society_id, page: 1, page_size: 25, status: status || undefined };
  if (endpoint === "/invoices" || endpoint === "/expenses") return { society_id, page: 1, pageSize: 25, status: status || undefined };
  if (slug === "blocks") return { society_id };
  if (slug === "reports") return { period: "month" };
  return { ...scope, society_id, search: search || undefined, limit: 25, offset: 0 };
}

function statusOptions(slug: string) {
  if (slug.startsWith("complaints")) return ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  if (slug.startsWith("finance") || slug.startsWith("financials")) return ["PENDING", "PARTIAL", "PAID", "OVERDUE"];
  if (slug.startsWith("visitors")) return ["PENDING", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"];
  return ["ACTIVE", "INACTIVE", "OPERATIONAL", "MAINTENANCE"];
}

function buildStatusChart(rows: ResourceRecord[]) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const label = String(row.status ?? (row.is_active === false ? "INACTIVE" : "ACTIVE")).toUpperCase();
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  const data = Array.from(counts, ([name, value]) => ({ name, value }));
  return data.length ? data : [{ name: "NO DATA", value: 1 }];
}

function buildCategoryChart(rows: ResourceRecord[], columns: string[]) {
  const categoryKey = columns.find((key) => key.includes("type") || key.includes("category") || key.includes("block") || key.includes("role")) ?? "status";
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const label = String(row[categoryKey] ?? row.status ?? "Unclassified");
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  const data = Array.from(counts, ([name, value]) => ({ name, value })).slice(0, 6);
  return data.length ? data : [{ name: "No records", value: 0 }];
}

function isActive(row: ResourceRecord) {
  const status = String(row.status ?? row.occupancy_status ?? "").toUpperCase();
  return row.is_active === true || ["ACTIVE", "PAID", "RESOLVED", "OCCUPIED", "OPERATIONAL", "CHECKED_IN"].some((item) => status.includes(item));
}

function isIssue(row: ResourceRecord) {
  const status = String(row.status ?? row.priority ?? "").toUpperCase();
  return ["OPEN", "PENDING", "OVERDUE", "CRITICAL", "BREACHED", "MAINTENANCE"].some((item) => status.includes(item));
}

function numericValue(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-IN");
}

function formatAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount) : String(value ?? "-");
}
