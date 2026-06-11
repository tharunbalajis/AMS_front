import { Card, Skeleton } from "@ams/ui";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Car,
  ClipboardList,
  Home,
  PawPrint,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardApi } from "@/app/api/client";
import { useScope } from "@/app/scope/ScopeProvider";
import { QK } from "@/lib/queryKeys";

const QUICK_ACTIONS = [
  { label: "Add New Resident",      to: "/residents",             icon: Users        },
  { label: "Generate QR Passes",    to: "/residents/qr-pass",     icon: Shield       },
  { label: "Bulk Import",           to: "/residents/import",      icon: ClipboardList },
  { label: "View Lease Agreements", to: "/residents/leases",      icon: ClipboardList },
  { label: "Manage Vehicles",       to: "/residents/vehicles",    icon: Car          },
  { label: "Occupancy Heatmap",     to: "/residents/heatmap",     icon: TrendingUp   },
];

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  loading,
  to,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  loading: boolean;
  to?: string;
}) {
  const inner = (
    <Card className={`p-5 transition-shadow ${to ? "cursor-pointer hover:shadow-md" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          )}
          {sub && !loading && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={`rounded-lg p-3 ${color} shrink-0`}>
          <Icon size={22} />
        </div>
      </div>
      {to && !loading && (
        <div className="mt-3 flex items-center gap-1 text-xs text-blue-600 font-medium">
          View details <ArrowRight size={12} />
        </div>
      )}
    </Card>
  );

  if (to) return <Link to={to} className="block">{inner}</Link>;
  return inner;
}

export function ResidentOverviewPage() {
  const { selectedSocietyId } = useScope();
  const societyId = selectedSocietyId;

  const { data: stats, isLoading } = useQuery({
    queryKey: [...QK.dashboardStats(societyId!), "resident-overview"],
    queryFn: () => dashboardApi.stats(societyId),
    enabled: !!societyId,
    staleTime: 30_000,
    retry: false,
  });

  const occupancyPct = stats?.occupancy_pct ?? 0;
  const totalUnits   = stats?.total_units   ?? 0;
  const occupied     = stats?.occupied_units ?? 0;
  const vacant       = stats?.vacant_units  ?? (totalUnits - occupied);

  const statCards = [
    {
      label: "Total Units",
      value: totalUnits,
      sub:   `${occupied} occupied`,
      icon:  Home,
      color: "bg-blue-100 text-blue-700",
      to:    "/units",
    },
    {
      label: "Total Residents",
      value: stats?.total_residents ?? 0,
      sub:   `${stats?.total_members ?? 0} total members`,
      icon:  Users,
      color: "bg-indigo-100 text-indigo-700",
      to:    "/residents",
    },
    {
      label: "Owners",
      value: stats?.total_owners ?? 0,
      sub:   "active owner residents",
      icon:  Users,
      color: "bg-green-100 text-green-700",
      to:    "/residents",
    },
    {
      label: "Tenants",
      value: stats?.total_tenants ?? 0,
      sub:   "active tenant residents",
      icon:  TrendingUp,
      color: "bg-purple-100 text-purple-700",
      to:    "/residents/leases",
    },
    {
      label: "Occupied Units",
      value: occupied,
      sub:   `${vacant} vacant`,
      icon:  Home,
      color: "bg-emerald-100 text-emerald-700",
      to:    "/units",
    },
    {
      label: "Occupancy",
      value: `${occupancyPct}%`,
      sub:   `${totalUnits} total units`,
      icon:  TrendingUp,
      color: "bg-amber-100 text-amber-700",
      to:    "/residents/heatmap",
    },
    {
      label: "Active Leases",
      value: stats?.active_leases ?? 0,
      sub:   "current tenancy agreements",
      icon:  ClipboardList,
      color: "bg-orange-100 text-orange-700",
      to:    "/residents/leases",
    },
    {
      label: "Parking Occupied",
      value: stats?.parking_occupied ?? 0,
      sub:   "slots in use",
      icon:  Car,
      color: "bg-rose-100 text-rose-700",
      to:    "/residents/parking",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Residents / Overview</p>
        <h1 className="text-2xl font-bold text-gray-900">Resident Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Occupancy and resident statistics</p>
      </div>

      {/* Occupancy progress bar */}
      {!isLoading && totalUnits > 0 && (
        <Link to="/residents/heatmap">
          <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Occupancy</span>
              <span className="text-sm font-bold text-blue-700">{occupancyPct}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-3 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, occupancyPct)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              {occupied} of {totalUnits} units occupied · click to view heatmap
            </p>
          </Card>
        </Link>
      )}

      {isLoading && (
        <Card className="p-5">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-full" />
        </Card>
      )}

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(s => (
          <StatCard key={s.label} {...s} loading={isLoading} />
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-5">
        <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map(action => (
            <Link
              key={action.label}
              to={action.to}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition"
            >
              <action.icon size={16} className="text-blue-500 shrink-0" />
              {action.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
