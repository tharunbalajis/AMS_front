import { Button, Card, Input, Select } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { complaintsApi } from "@/api/complaints.api";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

export function RaiseComplaintPage() {
  const { queryParams, society } = useScope();
  const qc = useQueryClient();
  const societyId = queryParams?.society_id ?? society?.society_id ?? 1;

  const [unitId, setUnitId]         = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority]     = useState("MEDIUM");

  const unitsQuery = useQuery({
    queryKey: ["units-complaint", societyId],
    queryFn: () => residentsApi.getUnits({ society_id: societyId, page: 1, page_size: 300 }),
    enabled: Boolean(societyId),
    retry: false,
  });
  const units = normalizeList<Record<string, unknown>>(unitsQuery.data?.data ?? unitsQuery.data);

  const catsQuery = useQuery({
    queryKey: ["complaint-categories", societyId],
    queryFn: () => complaintsApi.getCategories({ society_id: societyId }),
    enabled: Boolean(societyId),
    retry: false,
  });
  const categories = normalizeList<Record<string, unknown>>(catsQuery.data?.data ?? catsQuery.data);

  const slaQuery = useQuery({
    queryKey: ["sla-priorities", societyId],
    queryFn: () => complaintsApi.getSlaPriorities({ society_id: societyId }),
    enabled: Boolean(societyId),
    retry: false,
  });
  const slaPriorities = normalizeList<Record<string, unknown>>(slaQuery.data?.data ?? slaQuery.data);
  const priorityHoursMap = slaPriorities.reduce<Record<string, number>>((map, item) => {
    const key = String(item.priority ?? '').toUpperCase();
    const value = Number(item.hours ?? NaN);
    if (key) map[key] = Number.isFinite(value) ? value : map[key] ?? 0;
    return map;
  }, {
    CRITICAL: 4,
    HIGH: 20,
    MEDIUM: 48,
    LOW: 60,
  });
  const selectedPriorityHours = priorityHoursMap[priority] ?? 48;
  const priorityLabelData = [
    { key: 'CRITICAL', label: 'Critical', color: 'text-red-600' },
    { key: 'HIGH',     label: 'High',     color: 'text-orange-600' },
    { key: 'MEDIUM',   label: 'Medium',   color: 'text-yellow-600' },
    { key: 'LOW',      label: 'Low',      color: 'text-gray-600' },
  ];

  const mutation = useMutation({
    mutationFn: () => {
      const residentId = localStorage.getItem('user_id') || 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      return complaintsApi.create({
        society_id:  societyId,
        unit_id:     Number(unitId),
        raised_by:   residentId,
        cat_id:      categoryId || null,
        title:       title.trim(),
        description: description.trim(),
        priority,
      });
    },
    onSuccess: () => {
      toast.success("Complaint submitted successfully");
      qc.invalidateQueries({ queryKey: ["complaints"] });
      setUnitId(""); setCategoryId(""); setTitle(""); setDescription(""); setPriority("MEDIUM");
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (e as Error)?.message
        ?? "Submission failed";
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId) { toast.error("Please select a unit"); return; }
    if (!title.trim()) { toast.error("Complaint title is required"); return; }
    if (!description.trim()) { toast.error("Description is required"); return; }
    mutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Complaints / Raise Complaint</p>
        <h1 className="text-2xl font-bold text-gray-900">Raise a Complaint</h1>
        <p className="mt-1 text-sm text-gray-500">Submit a new complaint for review and resolution</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Unit <span className="text-red-500">*</span>
                </label>
                <Select value={unitId} onChange={(e) => setUnitId(e.target.value)} required>
                  <option value="">Select your unit</option>
                  {units.map((u) => (
                    <option key={String(u.unit_id ?? u.id)} value={String(u.unit_id ?? u.id)}>
                      {String(u.unit_number ?? "-")}
                      {u.block_name ? ` · ${u.block_name}` : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Select category</option>
                  {categories.length > 0
                    ? categories.map((c) => (
                        <option key={String(c.id ?? c.category_id)} value={String(c.id ?? c.category_id)}>
                          {String(c.category_name ?? c.name ?? "-")}
                        </option>
                      ))
                    : (
                      <>
                        <option value="plumbing">Plumbing</option>
                        <option value="electrical">Electrical</option>
                        <option value="security">Security</option>
                        <option value="housekeeping">Housekeeping</option>
                        <option value="amenities">Amenities</option>
                        <option value="others">Others</option>
                      </>
                    )}
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Complaint Title <span className="text-red-500">*</span>
              </label>
              <Input placeholder="Brief summary of the issue" value={title}
                onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                className="h-28 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
              <div className="flex gap-2">
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 rounded-md border py-2 text-xs font-semibold transition ${
                      priority === p
                        ? p === "CRITICAL" ? "border-red-500 bg-red-500 text-white"
                          : p === "HIGH" ? "border-orange-500 bg-orange-500 text-white"
                          : p === "MEDIUM" ? "border-yellow-500 bg-yellow-500 text-white"
                          : "border-gray-500 bg-gray-500 text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >{p}</button>
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                Response target for selected priority: <strong>{selectedPriorityHours} hours</strong>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Attach Photo (optional)</label>
              <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400">
                <div className="text-center text-gray-400">
                  <Camera size={24} className="mx-auto mb-1" />
                  <p className="text-xs">Click to upload photo</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" type="button"
                onClick={() => { setUnitId(""); setCategoryId(""); setTitle(""); setDescription(""); setPriority("MEDIUM"); }}>
                Cancel
              </Button>
              <Button className="flex-1" type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? <><Loader2 size={15} className="mr-1 animate-spin" />Submitting…</>
                  : <><Send size={15} className="mr-1" />Submit Complaint</>}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900">SLA Guidelines</h3>
            <div className="mt-3 space-y-3">
              {categoryId && categories.length > 0 ? (
                (() => {
                  const selectedCategory = categories.find((c) => String(c.id ?? c.category_id) === categoryId);
                  return selectedCategory ? (
                    <>
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-sm font-medium text-blue-900">
                          <strong>{String(selectedCategory.category_name ?? "")}</strong>
                        </p>
                        <p className="mt-1 text-sm text-blue-800">
                          Response within <strong>{selectedCategory.sla_hours || 48} hours</strong>
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {priorityLabelData.map((item) => (
                        <div key={item.key} className="flex items-center justify-between text-sm">
                          <span className={`font-semibold ${item.color}`}>{item.label}</span>
                          <span className="text-gray-500">Response within {priorityHoursMap[item.key]} hours</span>
                        </div>
                      ))}
                    </>
                  );
                })()
              ) : (
                <>
                  {priorityLabelData.map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-sm">
                      <span className={`font-semibold ${item.color}`}>{item.label}</span>
                      <span className="text-gray-500">Response within {priorityHoursMap[item.key]} hours</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900">Complaint Process</h3>
            <ol className="mt-3 space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="font-bold text-blue-600">1.</span> Submit complaint with details</li>
              <li className="flex gap-2"><span className="font-bold text-blue-600">2.</span> Management reviews and assigns</li>
              <li className="flex gap-2"><span className="font-bold text-blue-600">3.</span> Assigned staff resolves the issue</li>
              <li className="flex gap-2"><span className="font-bold text-blue-600">4.</span> You receive resolution notification</li>
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
