import { StatusBadge } from "@ams/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft, Star, User,
  Home, Building2, Tag, Clock, ImageIcon, VideoIcon
} from "lucide-react";
import { complaintsApi } from "@/api/complaints.api";
import { useScope } from "@/app/scope/ScopeProvider";

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH:     "bg-orange-100 text-orange-700",
  MEDIUM:   "bg-yellow-100 text-yellow-800",
  LOW:      "bg-gray-100 text-gray-600",
};

function Field({
  label,
  value,
  icon: Icon,
  wide,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-gray-100 bg-gray-50 px-4 py-3${wide ? " col-span-2" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
        {label}
      </p>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
        <p className="text-sm font-medium text-gray-900 break-words">
          {value ?? <span className="text-gray-300">—</span>}
        </p>
      </div>
    </div>
  );
}

export function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { queryParams } = useScope();
  const queryClient = useQueryClient();
  const [selectedStaff, setSelectedStaff]     = useState("");
  const [newStatus, setNewStatus]             = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: c, isLoading, error } = useQuery({
    queryKey: ["complaint-detail", id],
    queryFn: async () => {
      const res = await complaintsApi.getById(id!);
      return res?.data ?? res;
    },
    enabled: !!id,
  });

  const { data: staffRaw } = useQuery({
    queryKey: ["staff-assign", queryParams],
    queryFn: async () => {
      const res = await complaintsApi.getStaff({
        ...queryParams,
        is_active: true,
        page_size: 200,
      });
      return res?.data ?? res;
    },
  });
  const allStaff: Record<string, unknown>[] = Array.isArray(staffRaw)
    ? staffRaw
    : (staffRaw as Record<string, unknown[]> | null)?.data ?? [];
  const activeStaff = allStaff.filter(
    (s) =>
      s.is_active !== false &&
      (s.status === undefined || String(s.status).toUpperCase() === "ACTIVE")
  );

  const getStaffId   = (s: Record<string, unknown>) => String(s.id ?? s.staff_id ?? "");
  const getStaffName = (s: Record<string, unknown>) =>
    String(
      s.full_name ??
      (s.first_name ? `${s.first_name} ${s.last_name ?? ""}`.trim() : null) ??
      s.name ??
      `Staff #${getStaffId(s)}`
    );

  const assignMutation = useMutation({
    mutationFn: () => complaintsApi.assign(id!, { assigned_to: selectedStaff }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaint-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["complaints-tracking"] });
      setSelectedStaff("");
      alert("Staff assigned successfully!");
    },
    onError: (e: unknown) => alert(`Error: ${(e as Error).message}`),
  });

  const statusMutation = useMutation({
    mutationFn: () =>
      complaintsApi.updateStatus(id!, {
        status: newStatus,
        ...(newStatus === "RESOLVED" && { resolution_notes: resolutionNotes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaint-detail", id] });
      setNewStatus("");
      setResolutionNotes("");
      alert("Status updated!");
    },
    onError: (e: unknown) => alert(`Error: ${(e as Error).message}`),
  });

  const ratingMutation = useMutation({
    mutationFn: (rating: number) => complaintsApi.submitRating(id!, { rating }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["complaint-detail", id] }),
  });

  const fmt = (d: unknown) =>
    d
      ? new Date(String(d)).toLocaleString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : null;

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-20 text-gray-400">
        Loading complaint details...
      </div>
    );
  if (error || !c)
    return (
      <div className="flex items-center justify-center p-20 text-gray-400">
        Complaint not found.
      </div>
    );

  const status   = String(c.status   ?? "").toUpperCase();
  const priority = String(c.priority ?? "").toUpperCase();

  // Match backend VALID_STATUS_TRANSITIONS exactly
  const STATUS_TRANSITIONS: Record<string, string[]> = {
    OPEN:        ["ASSIGNED"],
    ASSIGNED:    ["IN_PROGRESS"],
    IN_PROGRESS: ["RESOLVED"],
    RESOLVED:    ["CLOSED"],
  };
  const nextStatuses = STATUS_TRANSITIONS[status] ?? [];
  const isClosed = status === "CLOSED";

  // Media — complaint_media table uses `media_type` (PHOTO/VIDEO) and `file_url`
  const media: Record<string, unknown>[] = Array.isArray(c.media)
    ? (c.media as Record<string, unknown>[])
    : [];
  const images = media.filter((m) => String(m.media_type ?? "").toUpperCase() === "PHOTO");
  const videos = media.filter((m) => String(m.media_type ?? "").toUpperCase() === "VIDEO");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-xs text-gray-400">{String(c.ticket_number ?? "")}</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{String(c.title ?? "")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${PRIORITY_COLORS[priority] ?? "bg-gray-100 text-gray-600"}`}>
              {priority}
            </span>
            <StatusBadge value={c.status} />
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Unit"     value={String(c.unit_number   ?? "") || null} icon={Home}      />
        <Field label="Block"    value={String(c.block_name    ?? "") || null} icon={Building2} />
        <Field label="Category" value={String(c.category_name ?? "") || null} icon={Tag}       />
        <Field
          label="Raised By"
          value={
            c.raised_by_name
              ? `${String(c.raised_by_name)}${c.raised_by_mobile ? ` • ${String(c.raised_by_mobile)}` : ""}`
              : null
          }
          icon={User}
        />
        <Field
          label="Assigned To"
          value={
            c.assigned_to_name && String(c.assigned_to_name) !== "Unassigned"
              ? `${String(c.assigned_to_name)}${c.staff_mobile ? ` • ${String(c.staff_mobile)}` : ""}${c.staff_role ? ` (${String(c.staff_role)})` : ""}`
              : "Unassigned"
          }
          icon={User}
        />
        <Field label="Assigned At" value={fmt(c.assigned_at)} icon={Clock} />
        <Field label="Created"     value={fmt(c.created_at)}  icon={Clock} />
        <Field label="SLA Due"     value={fmt(c.sla_due)}     icon={Clock} />
        {c.resolved_at && (
          <Field label="Resolved At" value={fmt(c.resolved_at)} icon={Clock} />
        )}
        <Field
          label="SLA Breach"
          value={
            c.sla_breach === true
              ? <span className="text-red-600 font-semibold">⚠ Breached</span>
              : <span className="text-green-600 font-semibold">✅ Within SLA</span>
          }
          wide
        />
      </div>

      {/* Description */}
      <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Description
        </p>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {String(c.description ?? "—")}
        </p>
        {c.resolution_notes && (
          <div className="mt-3 border-t border-gray-200 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Resolution Notes
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {String(c.resolution_notes)}
            </p>
          </div>
        )}
      </div>

      {/* Attachments */}
      <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          Attachments
        </p>
        {media.length === 0 ? (
          <p className="text-sm text-gray-400">Not available</p>
        ) : (
          <div className="space-y-3">
            {images.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <ImageIcon size={12} /> {images.length} photo{images.length > 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {images.map((img, i) => (
                    <a
                      key={i}
                      href={String(img.file_url ?? "")}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={String(img.file_url ?? "")}
                        alt={`photo-${i + 1}`}
                        className="h-24 w-24 rounded-lg object-cover border border-gray-200
                                   hover:opacity-80 transition-opacity cursor-pointer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {videos.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <VideoIcon size={12} /> {videos.length} video{videos.length > 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {videos.map((vid, i) => (
                    <a
                      key={i}
                      href={String(vid.file_url ?? "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-gray-200
                                 bg-white px-3 py-2 text-xs text-blue-600 hover:bg-blue-50"
                    >
                      <VideoIcon size={12} />
                      {String(vid.file_url ?? "").split("/").pop() || `video-${i + 1}`}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Staff — only when OPEN or ASSIGNED */}
      {(status === "OPEN" || status === "ASSIGNED") && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Assign to Staff</p>
          <div className="flex gap-2">
            <select
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
            >
              <option value="">
                {activeStaff.length === 0 ? "No active staff found" : "Select staff member..."}
              </option>
              {activeStaff.map((s) => (
                <option key={getStaffId(s)} value={getStaffId(s)}>
                  {getStaffName(s)}{s.role ? ` — ${String(s.role)}` : ""}{s.mobile ? ` • ${String(s.mobile)}` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={() => assignMutation.mutate()}
              disabled={!selectedStaff || assignMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium
                         text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {assignMutation.isPending ? "..." : "Assign"}
            </button>
          </div>
        </div>
      )}

      {/* Update Status */}
      {nextStatuses.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Update Status</p>
          <div className="flex gap-2">
            <select
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newStatus}
              onChange={(e) => { setNewStatus(e.target.value); setResolutionNotes(""); }}
            >
              <option value="">Select new status...</option>
              {nextStatuses.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <button
              onClick={() => statusMutation.mutate()}
              disabled={
                !newStatus ||
                statusMutation.isPending ||
                (newStatus === "RESOLVED" && resolutionNotes.trim().length < 10)
              }
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium
                         text-white hover:bg-gray-900 disabled:opacity-50"
            >
              {statusMutation.isPending ? "..." : "Update"}
            </button>
          </div>
          {newStatus === "RESOLVED" && (
            <div className="mt-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                Resolution Notes <span className="text-red-400">(required, min 10 chars)</span>
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe how the issue was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-400">{resolutionNotes.trim().length}/10 min</p>
            </div>
          )}
        </div>
      )}

      {/* Resident Rating — only when CLOSED */}
      {isClosed && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Resident Rating</p>
          {c.resident_rating ? (
            <>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={22}
                    className={Number(c.resident_rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                  />
                ))}
              </div>
              <p className="mt-1 text-sm font-bold text-gray-700">{Number(c.resident_rating)}/5</p>
              {c.resident_feedback && (
                <p className="mt-2 text-sm text-gray-500">{String(c.resident_feedback)}</p>
              )}
            </>
          ) : (
            <div>
              <p className="mb-3 text-sm text-gray-500">Rate this resolution:</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => ratingMutation.mutate(star)}
                    className="rounded-full p-1 hover:bg-yellow-50"
                  >
                    <Star size={22} className="text-yellow-400 hover:fill-yellow-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
