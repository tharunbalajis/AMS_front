import { Badge, DataTable, SearchBox, Select } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useState } from "react";
import { usersApi } from "../../../app/api/client";
import { useScope } from "../../../app/scope/ScopeProvider";

const PAGE_SIZE = 25;

const ENTITY_TYPES = ["", "user", "resident", "unit", "complaint", "role", "payment", "staff", "visitor"];

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-purple-100 text-purple-700",
  LOGOUT: "bg-gray-100 text-gray-700",
  EXPORT: "bg-amber-100 text-amber-700",
  IMPORT: "bg-teal-100 text-teal-700",
};

export function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { queryParams } = useScope();

  const query = useQuery({
    queryKey: ["audit-logs", queryParams, search, entityType, dateFrom, dateTo, page],
    queryFn: () =>
      usersApi.auditLogs({
        ...queryParams,
        search: search || undefined,
        entity_type: entityType || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page: page + 1,
        pageSize: PAGE_SIZE,
      }),
  });

  const rows = normalizeList<Record<string, unknown>>(query.data);
  const hasNextPage = rows.length === PAGE_SIZE;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">Login, logout, role changes, user updates, settings, imports, exports, and critical actions.</p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <SearchBox
          className="min-w-[240px] flex-1"
          placeholder="Search by action, user, entity..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
        />

        <Select className="w-44" value={entityType} onChange={e => { setEntityType(e.target.value); setPage(0); }}>
          {ENTITY_TYPES.map(t => (
            <option key={t} value={t}>{t ? t.charAt(0).toUpperCase() + t.slice(1) : "All Entities"}</option>
          ))}
        </Select>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(0); }}
            className="h-9 rounded-md border border-gray-200 px-3 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(0); }}
            className="h-9 rounded-md border border-gray-200 px-3 text-sm"
          />
        </div>

        {(search || entityType || dateFrom || dateTo) && (
          <button
            className="text-sm text-gray-500 hover:text-gray-700 px-2"
            onClick={() => { setSearch(""); setEntityType(""); setDateFrom(""); setDateTo(""); setPage(0); }}
          >
            Clear
          </button>
        )}
      </div>

      <DataTable
        title="Activity Trail"
        rows={rows}
        isLoading={query.isLoading}
        columns={[
          {
            key: "action",
            header: "ACTION",
            render: row => {
              const action = String(row.action ?? "");
              const cls = ACTION_COLORS[action.toUpperCase()] ?? "bg-gray-100 text-gray-700";
              return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${cls}`}>
                  {action}
                </span>
              );
            }
          },
          { key: "entity_type", header: "ENTITY" },
          { key: "entity_id", header: "ENTITY ID", render: row => <span className="text-xs text-gray-500 font-mono">{String(row.entity_id ?? "—").slice(0, 8)}…</span> },
          { key: "user_email", header: "USER" },
          {
            key: "created_at",
            header: "TIMESTAMP",
            render: row => {
              const d = row.created_at ? new Date(String(row.created_at)) : null;
              return <span className="text-xs text-gray-600">{d ? d.toLocaleString() : "—"}</span>;
            }
          },
          {
            key: "changes",
            header: "",
            render: row => {
              const id = String(row.id ?? row.log_id ?? "");
              const hasChanges = row.changes_before || row.changes_after || row.metadata;
              if (!hasChanges) return null;
              return (
                <button
                  title="View changes"
                  className="p-1 text-gray-400 hover:text-blue-600"
                  onClick={e => { e.stopPropagation(); setExpandedRow(expandedRow === id ? null : id); }}
                >
                  <Info size={14} />
                </button>
              );
            }
          }
        ]}
      />

      {expandedRow && (() => {
        const row = rows.find(r => String(r.id ?? r.log_id ?? "") === expandedRow);
        if (!row) return null;
        return (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">Change diff for {expandedRow.slice(0, 8)}…</p>
            <div className="grid grid-cols-2 gap-4">
              {row.changes_before && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Before</p>
                  <pre className="text-xs bg-white rounded p-2 border overflow-auto max-h-40">{JSON.stringify(row.changes_before, null, 2)}</pre>
                </div>
              )}
              {row.changes_after && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">After</p>
                  <pre className="text-xs bg-white rounded p-2 border overflow-auto max-h-40">{JSON.stringify(row.changes_after, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Page {page + 1} — showing {rows.length} records
        </p>
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <button
            disabled={!hasNextPage}
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
