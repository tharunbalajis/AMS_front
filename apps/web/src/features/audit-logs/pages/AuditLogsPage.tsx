import { Badge, DataTable, SearchBox } from "@ams/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { usersApi } from "../../../app/api/client";
import { useScope } from "../../../app/scope/ScopeProvider";

export function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const { queryParams } = useScope();
  const query = useQuery({ queryKey: ["audit-logs", queryParams, search], queryFn: () => usersApi.auditLogs({ ...queryParams, search, limit: 25, offset: 0 }) });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">Login, logout, role changes, user updates, settings updates, imports, exports, and critical actions.</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <SearchBox placeholder="Search audit logs" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <DataTable
        title="Activity Trail"
        rows={query.data ?? []}
        isLoading={query.isLoading}
        columns={[
          { key: "action", header: "action", render: (row) => <Badge>{String(row.action ?? "ACTION")}</Badge> },
          { key: "entity_type", header: "entity" },
          { key: "user_email", header: "user" },
          { key: "created_at", header: "created at" }
        ]}
      />
    </div>
  );
}
