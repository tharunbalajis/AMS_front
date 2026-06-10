import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { complaintsApi } from "@/api/complaints.api";
import { useScope } from "@/app/scope/ScopeProvider";

const DEFAULT_PRIORITIES = [
  { priority: "CRITICAL", hours: 4,  color: "bg-red-100 text-red-700 border-red-200",          label: "Critical" },
  { priority: "HIGH",     hours: 20, color: "bg-orange-100 text-orange-700 border-orange-200",  label: "High"     },
  { priority: "MEDIUM",   hours: 48, color: "bg-yellow-100 text-yellow-700 border-yellow-200",  label: "Medium"   },
  { priority: "LOW",      hours: 60, color: "bg-gray-100 text-gray-600 border-gray-200",         label: "Low"      },
];

export function CategoriesPage() {
  const { queryParams } = useScope();
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd]     = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]           = useState({ category_name: "", sla_hours: "", escalation_hours: "" });
  const [localPriorityHours, setLocalPriorityHours] = useState<Record<string, number>>({});
  const [savedMessage, setSavedMessage] = useState("");

  const { data: catRaw, isLoading } = useQuery({
    queryKey: ["complaint-categories", queryParams],
    queryFn: async () => {
      const res = await complaintsApi.getCategories({ ...queryParams, include_inactive: true });
      return res?.data ?? res;
    },
  });
  const categories: Record<string, unknown>[] = Array.isArray(catRaw)
    ? catRaw
    : (catRaw as Record<string, unknown[]> | null)?.data ?? [];

  const { data: slaRaw } = useQuery({
    queryKey: ["sla-priorities", queryParams],
    queryFn: async () => {
      const res = await complaintsApi.getSlaPriorities({ ...queryParams });
      return res?.data ?? res;
    },
  });
  const slaFromDb: Record<string, unknown>[] = Array.isArray(slaRaw)
    ? slaRaw
    : (slaRaw as Record<string, unknown[]> | null)?.data ?? [];

  // Merge DB values into defaults; localPriorityHours overrides both (user edits)
  const priorities = DEFAULT_PRIORITIES.map(p => {
    const fromDb = slaFromDb.find(s => String(s.priority) === p.priority);
    const dbHours = fromDb ? Number(fromDb.hours) : p.hours;
    return { ...p, hours: localPriorityHours[p.priority] ?? dbHours };
  });

  const createMutation = useMutation({
    mutationFn: () => complaintsApi.createCategory({
      ...queryParams,
      ...form,
      sla_hours: Number(form.sla_hours),
      escalation_hours: Number(form.escalation_hours)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaint-categories"] });
      setForm({ category_name: "", sla_hours: "", escalation_hours: "" });
      setShowAdd(false);
    },
    onError: (e: unknown) => alert(`Error: ${(e as Error).message}`),
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) => complaintsApi.updateCategory(id, {
      ...form,
      sla_hours: Number(form.sla_hours),
      escalation_hours: Number(form.escalation_hours)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaint-categories"] });
      setEditingId(null);
    },
    onError: (e: unknown) => alert(`Error: ${(e as Error).message}`),
  });

  const validateCategoryForm = () => {
    const sla = Number(form.sla_hours);
    const escalation = Number(form.escalation_hours);

    if (!form.category_name.trim()) {
      alert('Category name is required');
      return false;
    }
    if (!Number.isFinite(sla) || sla < 1) {
      alert('SLA hours must be a positive number');
      return false;
    }
    if (!Number.isFinite(escalation) || escalation <= sla) {
      alert('Escalation hours must be greater than SLA hours');
      return false;
    }
    return true;
  };

  const submitCategoryForm = () => {
    if (!validateCategoryForm()) return;
    if (editingId) {
      updateMutation.mutate(editingId);
    } else {
      createMutation.mutate();
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => complaintsApi.deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["complaint-categories"] }),
    onError: (e: unknown) => alert(`Delete failed: ${(e as Error).message}`),
  });

  const slaMutation = useMutation({
    mutationFn: () => complaintsApi.updateSlaPriorities({
      ...queryParams,
      priorities: priorities.map(p => ({ priority: p.priority, hours: p.hours }))
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-priorities"] });
      setSavedMessage("SLA settings saved successfully.");
      setTimeout(() => setSavedMessage(""), 3000);
    },
    onError: (e: unknown) => {
      const errorMessage = (e as { response?: { data?: { error?: string; message?: string } } })
        ?.response?.data?.error
        || (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Failed to save SLA settings.";
      setSavedMessage(errorMessage);
      setTimeout(() => setSavedMessage(""), 3000);
    },
  });

  const startEdit = (cat: Record<string, unknown>) => {
    setEditingId(String(cat.id ?? ""));
    setForm({
      category_name:    String(cat.category_name    ?? ""),
      sla_hours:        String(cat.sla_hours        ?? ""),
      escalation_hours: String(cat.escalation_hours ?? ""),
    });
  };

  if (isLoading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">Complaints / Categories</p>
          <h1 className="text-2xl font-bold text-gray-900">Complaint Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Manage complaint categories, SLA targets, and escalation thresholds.</p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
            setForm({ category_name: "", sla_hours: "", escalation_hours: "" });
          }}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={15} /> Add Category
        </button>
      </div>

      {/* Add / Edit form */}
      {(showAdd || editingId) && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">{editingId ? "Edit Category" : "New Category"}</h3>
          <div className="flex gap-3">
            <input
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Category name"
              value={form.category_name}
              onChange={(e) => setForm(f => ({ ...f, category_name: e.target.value }))}
            />
            <input
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="SLA hours"
              type="number"
              value={form.sla_hours}
              onChange={(e) => setForm(f => ({ ...f, sla_hours: e.target.value }))}
            />
            <input
              className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Escalation hours"
              type="number"
              value={form.escalation_hours}
              onChange={(e) => setForm(f => ({ ...f, escalation_hours: e.target.value }))}
            />
            <button
              onClick={submitCategoryForm}
              disabled={!form.category_name}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {editingId ? "Save" : "Create"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setEditingId(null); }}
              className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["NAME", "SLA HOURS", "ESCALATION HOURS", "ACTIONS"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <tr key={String(cat.id ?? "")} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{String(cat.category_name ?? "")}</td>
                <td className="px-4 py-3 text-gray-600">{String(cat.sla_hours ?? "—")}</td>
                <td className="px-4 py-3 text-gray-600">{String(cat.escalation_hours ?? "—")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => startEdit(cat)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${String(cat.category_name ?? "")}"?`)) {
                          deleteMutation.mutate(String(cat.id ?? ""));
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SLA Priority Guidelines */}
      <div>
        <h2 className="text-base font-semibold text-gray-800">SLA Priority Guidelines</h2>
        <p className="mt-1 text-sm text-gray-500">Set the response time target for each complaint priority level.</p>
        <div className="mt-4 flex flex-wrap gap-4">
          {priorities.map(p => (
            <div key={p.priority} className={`rounded-lg border-2 p-4 w-44 ${p.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase">{p.label}</span>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  className="w-16 rounded border px-1 py-0.5 text-sm bg-white text-gray-800"
                  value={p.hours}
                  onChange={(e) => setLocalPriorityHours(h => ({ ...h, [p.priority]: Number(e.target.value) }))}
                />
                <span className="text-xs">hrs</span>
              </div>
              <p className="mt-1 text-xs">Respond within {p.hours}h</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={() => slaMutation.mutate()}
            disabled={slaMutation.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {slaMutation.isPending ? "Saving..." : "Save SLA Settings"}
          </button>
          {savedMessage && (
            <span className={`text-sm font-medium ${savedMessage.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
              {savedMessage}
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-amber-600">
          ⚠ Changing these hours affects SLA Due calculations for ALL new complaints with that priority. Existing complaints are not affected.
        </p>
      </div>
    </div>
  );
}
