import { useQuery } from "@tanstack/react-query";
import { residentsApi } from "../../../api/residents.api";
import {
  AlertCircle, Car, FileText, Home, PawPrint, UserCheck, X
} from "lucide-react";

interface TimelineEvent {
  type: string;
  date: string;
  title: string;
  detail: Record<string, unknown>;
}

interface Props {
  residentId: string;
  residentName?: string;
  onClose?: () => void;
}

const EVENT_ICON: Record<string, typeof Home> = {
  REGISTRATION: Home,
  LEASE_START: FileText,
  LEASE_END: FileText,
  COMPLAINT_RAISED: AlertCircle,
  COMPLAINT_RESOLVED: UserCheck,
  VEHICLE_ADDED: Car,
  PET_ADDED: PawPrint,
  MOVE_OUT: Home,
};

const EVENT_COLOR: Record<string, string> = {
  REGISTRATION: "bg-blue-100 text-blue-700 border-blue-200",
  LEASE_START: "bg-purple-100 text-purple-700 border-purple-200",
  LEASE_END: "bg-purple-100 text-purple-700 border-purple-200",
  COMPLAINT_RAISED: "bg-red-100 text-red-700 border-red-200",
  COMPLAINT_RESOLVED: "bg-green-100 text-green-700 border-green-200",
  VEHICLE_ADDED: "bg-amber-100 text-amber-700 border-amber-200",
  PET_ADDED: "bg-teal-100 text-teal-700 border-teal-200",
  MOVE_OUT: "bg-gray-100 text-gray-700 border-gray-200",
};

function formatDate(d: string) {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function ResidentTimeline({ residentId, residentName, onClose }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["resident-timeline", residentId],
    queryFn: async () => {
      const res = await residentsApi.getTimeline(residentId);
      return res.data;
    },
    enabled: Boolean(residentId),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Resident Timeline</h2>
          {residentName && <p className="text-xs text-gray-500">{residentName}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 text-center py-8">Failed to load timeline.</p>
        )}

        {data && data.events.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No timeline events found.</p>
        )}

        {data && data.events.length > 0 && (
          <div className="relative space-y-4">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-200" />
            {(data.events as any[]).map((event: any, i: number) => {
              const Icon = EVENT_ICON[event.type] ?? Home;
              const colorClass = EVENT_COLOR[event.type] ?? "bg-gray-100 text-gray-700 border-gray-200";
              return (
                <div key={i} className="relative flex gap-4">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border z-10 ${colorClass}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{event.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(event.date)}</p>
                    {Object.keys(event.detail ?? {}).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(event.detail).map(([k, v]) => v != null && (
                          <span key={k} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize">
                            {k.replace(/_/g, " ")}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
