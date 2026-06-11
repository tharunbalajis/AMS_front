import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, User, Home, ExternalLink } from "lucide-react";
import { complaintsApi } from "@/api/complaints.api";
import { useScope } from "@/app/scope/ScopeProvider";

// ── Level config ──────────────────────────────────────────────────
const LEVEL_CONFIG = {
  1: {
    label:     "Level 1",
    sublabel:  "Overdue 0–24h past threshold",
    bg:        "bg-orange-50",
    border:    "border-orange-300",
    badge:     "bg-orange-100 text-orange-800 border border-orange-300",
    dot:       "bg-orange-400",
    rowBg:     "bg-orange-50/40",
    rowBorder: "border-l-orange-400",
  },
  2: {
    label:     "Level 2",
    sublabel:  "Overdue 24–48h past threshold",
    bg:        "bg-red-50",
    border:    "border-red-300",
    badge:     "bg-red-100 text-red-800 border border-red-300",
    dot:       "bg-red-500",
    rowBg:     "bg-red-50/40",
    rowBorder: "border-l-red-500",
  },
  3: {
    label:     "Level 3",
    sublabel:  "Overdue 48h+ past threshold — CRITICAL",
    bg:        "bg-red-100",
    border:    "border-red-500",
    badge:     "bg-red-700 text-white border border-red-800",
    dot:       "bg-red-700 animate-pulse",
    rowBg:     "bg-red-100/60",
    rowBorder: "border-l-red-700",
  },
} as const;

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border border-red-300",
  HIGH:     "bg-orange-100 text-orange-700 border border-orange-300",
  MEDIUM:   "bg-yellow-100 text-yellow-800 border border-yellow-300",
  LOW:      "bg-gray-100 text-gray-600 border border-gray-300",
};

export function EscalationQueuePage() {
  const navigate               = useNavigate();
  const { queryParams }        = useScope();
  const [levelFilter, setLevelFilter] = useState<"" | "1" | "2" | "3">("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["escalation-queue", queryParams, levelFilter],
    queryFn: async () => {
      const res = await complaintsApi.getEscalationQueue({
        ...queryParams,
        level:     levelFilter || undefined,
        page_size: 200,
      });
      return res?.data ?? res;
    },
    refetchInterval: 60_000,
  });

  const allRows: Record<string, unknown>[] = Array.isArray(raw)
    ? raw
    : (raw as { data?: Record<string, unknown>[] } | null)?.data ?? [];

  const byLevel = { 1: 0, 2: 0, 3: 0 };
  allRows.forEach((r) => {
    const l = Number(r.escalation_level) as 1 | 2 | 3;
    if (l in byLevel) byLevel[l]++;
  });

  const fmt = (d: unknown) =>
    d
      ? new Date(String(d)).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
        })
      : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-600" />
          Escalation Queue
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Complaints that have crossed their escalation threshold and need
          immediate action. Auto-refreshes every 60 seconds.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {([1, 2, 3] as const).map((lvl) => {
          const cfg = LEVEL_CONFIG[lvl];
          return (
            <button
              key={lvl}
              onClick={() =>
                setLevelFilter((prev) => (prev === String(lvl) ? "" : String(lvl) as "1"|"2"|"3"))
              }
              className={`rounded-xl border-2 p-4 text-left transition-all
                ${cfg.bg} ${cfg.border}
                ${levelFilter === String(lvl)
                  ? "ring-2 ring-offset-2 ring-red-400 shadow-md"
                  : "hover:shadow-md"
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
                  {cfg.label}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {byLevel[lvl]}
              </p>
              <p className="text-xs text-gray-500 mt-1">{cfg.sublabel}</p>
            </button>
          );
        })}
      </div>

      {levelFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Showing Level {levelFilter} only
          </span>
          <button
            onClick={() => setLevelFilter("")}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => (
            <div key={i}
              className="h-16 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : allRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200
                        bg-gray-50 py-20 text-center">
          <AlertTriangle size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-400">
            No escalated complaints
          </p>
          <p className="text-xs text-gray-300 mt-1">
            All complaints are within escalation thresholds 🎉
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden
                        bg-white shadow-sm">
          <div className="grid grid-cols-[120px_1fr_120px_100px_120px_110px_80px]
                          gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200
                          text-xs font-semibold uppercase tracking-wide text-gray-400">
            <span>Ticket</span>
            <span>Complaint</span>
            <span>Unit / Block</span>
            <span>Priority</span>
            <span>Assigned To</span>
            <span>Overdue</span>
            <span></span>
          </div>

          <div className="divide-y divide-gray-100">
            {allRows.map((row) => {
              const lvl = Number(row.escalation_level) as 1 | 2 | 3;
              const cfg = LEVEL_CONFIG[lvl] ?? LEVEL_CONFIG[1];
              const priority = String(row.priority ?? "").toUpperCase();
              const hoursOverdue = Number(row.hours_overdue ?? 0);

              return (
                <div
                  key={String(row.id)}
                  className={`grid grid-cols-[120px_1fr_120px_100px_120px_110px_80px]
                              gap-3 px-4 py-4 items-center border-l-4
                              ${cfg.rowBg} ${cfg.rowBorder}
                              hover:brightness-95 transition-all cursor-pointer`}
                  onClick={() => navigate(`/complaints/${String(row.id)}`)}
                >
                  <div className="space-y-1">
                    <p className="font-mono text-xs font-bold text-blue-600 truncate">
                      {String(row.ticket_number ?? "")}
                    </p>
                    <span className={`inline-flex items-center gap-1
                                      rounded-full px-2 py-0.5 text-xs font-bold
                                      ${cfg.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      L{lvl}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {String(row.title ?? "")}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {String(row.category_name ?? "—")}
                      {row.raised_by_name
                        ? ` • ${String(row.raised_by_name)}`
                        : ""}
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Raised: {fmt(row.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Home size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">
                      {String(row.unit_number ?? "—")}
                      {row.block_name ? ` · ${String(row.block_name)}` : ""}
                    </span>
                  </div>

                  <div>
                    <span className={`rounded-full px-2 py-0.5 text-xs
                                      font-bold ${PRIORITY_COLORS[priority]
                                        ?? "bg-gray-100 text-gray-600"}`}>
                      {priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-600
                                  min-w-0">
                    <User size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">
                      {row.assigned_to_name
                        ? String(row.assigned_to_name)
                        : <span className="text-gray-300 italic">Unassigned</span>
                      }
                    </span>
                  </div>

                  <div>
                    <p className={`text-sm font-bold
                      ${lvl === 3 ? "text-red-700" :
                        lvl === 2 ? "text-red-500" : "text-orange-600"}`}>
                      {hoursOverdue}h overdue
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {Number(row.hours_elapsed ?? 0)}h elapsed
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/complaints/${String(row.id)}`);
                      }}
                      className="flex items-center gap-1 rounded-lg border
                                 border-blue-200 bg-blue-50 px-2.5 py-1.5
                                 text-xs font-semibold text-blue-600
                                 hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink size={11} />
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {allRows.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Showing {allRows.length} escalated complaint
          {allRows.length !== 1 ? "s" : ""} —
          sorted by most overdue first
        </p>
      )}
    </div>
  );
}
