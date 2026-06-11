import { Card, DataTable, Skeleton, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { UserCheck, UserMinus, UserX, Users } from "lucide-react";
import { visitorsApi } from "@/api/visitors.api";
import { useScope } from "@/app/scope/ScopeProvider";


export function StaffAttendancePage() {
  const { queryParams } = useScope();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["staff-attendance", queryParams],
    queryFn: () => visitorsApi.getStaff({ ...queryParams }),
    retry: false,
    throwOnError: false,
  });
  const rows = normalizeList<Record<string, unknown>>(
    (raw as any)?.data?.data?.data ?? (raw as any)?.data?.data ?? raw?.data ?? raw
  );

  const present = rows.filter((r) => String(r.status ?? "") === "PRESENT").length;
  const late = rows.filter((r) => String(r.status ?? "") === "LATE").length;
  const absent = rows.filter((r) => String(r.status ?? "") === "ABSENT").length;

  const stats = [
    { label: "Total Staff", value: rows.length, icon: Users, color: "bg-blue-100 text-blue-700" },
    { label: "Present", value: present, icon: UserCheck, color: "bg-green-100 text-green-700" },
    { label: "Late", value: late, icon: UserMinus, color: "bg-amber-100 text-amber-700" },
    { label: "Absent", value: absent, icon: UserX, color: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / Staff Attendance</p>
        <h1 className="text-2xl font-bold text-gray-900">Staff Attendance</h1>
        <p className="mt-1 text-sm text-gray-500">Today's attendance and clock-in records</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                {isLoading ? <Skeleton className="mt-2 h-8 w-12" /> : <p className="mt-1 text-3xl font-bold text-gray-900">{s.value}</p>}
              </div>
              <div className={`rounded-lg p-3 ${s.color}`}><s.icon size={22} /></div>
            </div>
          </Card>
        ))}
      </div>

      <DataTable
        title="Attendance Log"
        rows={rows}
        isLoading={isLoading}
        columns={[
          {
            key: "name", header: "STAFF",
            render: (row) => (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                  {String(row.name ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <span className="font-medium">{String(row.name ?? "-")}</span>
              </div>
            )
          },
          { key: "role", header: "ROLE" },
          { key: "clock_in", header: "CLOCK-IN", render: (row) => <span>{String(row.clock_in ?? "—")}</span> },
          { key: "clock_out", header: "CLOCK-OUT", render: (row) => <span>{String(row.clock_out ?? "—")}</span> },
          { key: "status", header: "STATUS", render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
    </div>
  );
}
