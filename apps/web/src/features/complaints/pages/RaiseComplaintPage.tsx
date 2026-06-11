import { Button, Card, Input, Select } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { complaintsApi } from "@/api/complaints.api";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

export function RaiseComplaintPage() {
  type ResidentItem = {
    id: string;
    full_name: string;
    mobile: string;
    unit_id: string;
    unit_number: string;
  };

  const { queryParams, society } = useScope();
  const qc = useQueryClient();
  const societyId = queryParams?.society_id ?? society?.society_id ?? 1;

  const [unitId, setUnitId]         = useState("");
  const [unitSearch, setUnitSearch]   = useState("");
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const unitDropdownRef               = useRef<HTMLDivElement>(null);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority]     = useState("MEDIUM");
  const [complaintType, setComplaintType] = useState("USER");
  const [formData, setFormData] = useState<Record<string, unknown>>({
    unit_id: undefined,
    unit_number: undefined,
    raised_by: undefined,
  });
  const [residentSearch, setResidentSearch]     = useState("");
  const [selectedResident, setSelectedResident] = useState<ResidentItem | null>(null);
  const [mobileValue, setMobileValue]           = useState("");
  const [showDropdown, setShowDropdown]         = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImageName, setSelectedImageName] = useState("");
  const [imageError, setImageError]             = useState("");
  const dropdownRef                             = useRef<HTMLDivElement>(null);

  const unitsQuery = useQuery({
    queryKey: ["units-complaint", societyId],
    queryFn: () => residentsApi.getUnits({ society_id: societyId, page: 1, page_size: 300 }),
    enabled: Boolean(societyId),
    retry: false,
  });
  const units = normalizeList<Record<string, unknown>>(unitsQuery.data?.data ?? unitsQuery.data);
  const occupiedUnits = units.filter((u) => {
    const occupancyStatus = String(u.occupancy_status ?? u.status ?? "").toUpperCase();
    const occupiedStatuses = new Set([
      "OCCUPIED",
      "OWNER_OCCUPIED",
      "TENANT_OCCUPIED",
      "RENTED",
    ]);
    return u.is_occupied === true || occupiedStatuses.has(occupancyStatus);
  });

  const unitSearchTerm = unitSearch.trim().toLowerCase();
  const filteredUnits = unitSearchTerm
    ? occupiedUnits.filter((u) => {
        const text = `${String(u.unit_number ?? "")} ${String(u.block_name ?? "")}`;
        return text.toLowerCase().includes(unitSearchTerm);
      })
    : occupiedUnits.slice(0, 50);

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

  const { data: residentsRaw } = useQuery({
    queryKey: ["residents-by-unit", societyId, formData.unit_id ?? "all"],
    queryFn: async () => {
      const res = await complaintsApi.getResidentsByUnit({
        society_id: societyId,
        ...(formData.unit_id ? { unit_id: formData.unit_id } : {}),
      });
      return res?.data ?? res;
    },
    enabled: Boolean(societyId),
  });

  const allResidents: ResidentItem[] = Array.isArray(residentsRaw)
    ? residentsRaw
    : (residentsRaw as { data?: ResidentItem[] } | null)?.data ?? [];

  const filteredResidents = residentSearch.trim().length > 0
    ? allResidents.filter((r) =>
        r.full_name?.toLowerCase().includes(residentSearch.toLowerCase()) ||
        r.mobile?.includes(residentSearch)
      )
    : allResidents.slice(0, 50);

  useEffect(() => {
    if (!unitId || allResidents.length === 0) return;
    const matchingResident = allResidents.find(
      (r) => String(r.unit_id) === String(unitId)
    );
    if (!matchingResident) return;

    if (!selectedResident || selectedResident.id !== matchingResident.id) {
      setSelectedResident(matchingResident);
      setResidentSearch(matchingResident.full_name ?? "");
      setMobileValue(matchingResident.mobile ?? "");
      setFormData((prev: Record<string, unknown>) => ({
        ...prev,
        raised_by: matchingResident.id,
      }));
    }
  }, [unitId, allResidents, selectedResident]);

  const handleSelectResident = (r: ResidentItem) => {
    setSelectedResident(r);
    setResidentSearch(r.full_name ?? "");
    setMobileValue(r.mobile ?? "");
    setShowDropdown(false);

    if (!formData.unit_id && r.unit_id) {
      setUnitId(r.unit_id);
      setFormData((prev: Record<string, unknown>) => ({
        ...prev,
        unit_id:     r.unit_id,
        unit_number: r.unit_number,
        raised_by:   r.id,
      }));
    } else {
      setFormData((prev: Record<string, unknown>) => ({
        ...prev,
        raised_by: r.id,
      }));
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        unitDropdownRef.current &&
        !unitDropdownRef.current.contains(e.target as Node)
      ) {
        setShowUnitDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (
      formData.unit_id &&
      allResidents.length === 1 &&
      (!selectedResident || selectedResident.id !== allResidents[0].id)
    ) {
      handleSelectResident(allResidents[0]);
    }
  }, [formData.unit_id, allResidents.length]);

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
    mutationFn: (payload: Record<string, unknown>) => complaintsApi.create(payload),
    onSuccess: () => {
      toast.success("Complaint submitted successfully");
      qc.invalidateQueries({ queryKey: ["complaints"] });
      setUnitId("");
      setCategoryId("");
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setComplaintType("USER");
      setFormData({ unit_id: undefined, unit_number: undefined, raised_by: undefined });
      setResidentSearch("");
      setMobileValue("");
      setSelectedResident(null);
      setShowDropdown(false);
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
    if (!categoryId) { toast.error("Please select a category"); return; }
    if (!title.trim()) { toast.error("Complaint title is required"); return; }
    if (!description.trim()) { toast.error("Description is required"); return; }
    if (!formData.raised_by && !selectedResident) {
      alert("Please select the resident raising this complaint.");
      return;
    }

    const payload = {
      society_id: societyId,
      unit_id: Number(unitId),
      raised_by: selectedResident?.id ?? formData.raised_by,
      cat_id: categoryId,
      title: title.trim(),
      description: description.trim(),
      priority,
      complaint_type: complaintType,
    };

    mutation.mutate(payload);
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
                  Complaint Type <span className="text-red-500">*</span>
                </label>
                <Select
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value)}
                  required
                >
                  <option value="USER">User complaint</option>
                  <option value="MANAGEMENT">Management complaint</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Unit <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={unitDropdownRef}>
                  <Input
                    value={unitSearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUnitSearch(value);
                      setShowUnitDropdown(true);
                      if (unitId) {
                        setUnitId("");
                        setFormData((prev: Record<string, unknown>) => ({
                          ...prev,
                          unit_id: undefined,
                          unit_number: undefined,
                          raised_by: undefined,
                        }));
                        setSelectedResident(null);
                        setResidentSearch("");
                        setMobileValue("");
                      }
                    }}
                    onFocus={() => setShowUnitDropdown(true)}
                    placeholder="Type unit number"
                    required
                  />
                  {showUnitDropdown && filteredUnits.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                      {filteredUnits.map((u) => {
                        const optionLabel = `${String(u.unit_number ?? "-")}${u.block_name ? ` · ${u.block_name}` : ""}`;
                        const optionValue = String(u.unit_id ?? u.id ?? "");
                        return (
                          <button
                            key={optionValue}
                            type="button"
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                            onClick={() => {
                              setUnitId(optionValue);
                              setUnitSearch(optionLabel);
                              setFormData((prev: Record<string, unknown>) => ({
                                ...prev,
                                unit_id: optionValue,
                                unit_number: String(u.unit_number ?? optionLabel),
                              }));
                              setShowUnitDropdown(false);
                              setSelectedResident(null);
                              setResidentSearch("");
                              setMobileValue("");
                            }}
                          >
                            {optionLabel}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
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

            {/* ── Resident Name + Mobile ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resident Name <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <input
                    type="text"
                    placeholder="Search resident name..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={residentSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setResidentSearch(val);
                      setShowDropdown(true);
                      if (selectedResident && val !== selectedResident.full_name) {
                        setSelectedResident(null);
                        setFormData((prev: Record<string, unknown>) => ({
                          ...prev,
                          raised_by: undefined,
                        }));
                      }
                      if (!val) {
                        setSelectedResident(null);
                        setFormData((prev: Record<string, unknown>) => ({
                          ...prev,
                          raised_by: undefined,
                        }));
                      }
                    }}
                    onFocus={() => setShowDropdown(true)}
                  />

                  {showDropdown && filteredResidents.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-52 overflow-y-auto">
                      {filteredResidents.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                          onClick={() => handleSelectResident(r)}
                        >
                          <p className="font-medium text-gray-900">
                            {r.full_name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Unit: {r.unit_number ?? "—"}
                            {r.mobile ? ` • ${r.mobile}` : ""}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {showDropdown && residentSearch.trim().length > 0 && filteredResidents.length === 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg px-4 py-3 text-sm text-gray-400">
                      No resident found for "{residentSearch}"
                    </div>
                  )}
                </div>

                {selectedResident && (
                  <p className="mt-1 text-xs text-green-600 font-medium">
                    ✓ {selectedResident.full_name} selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="Auto-filled or enter manually"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={mobileValue}
                  onChange={(e) => setMobileValue(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-400">
                  {selectedResident
                    ? "Auto-filled — edit if incorrect"
                    : "Select resident above or enter manually"}
                </p>
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
              <div className="relative">
                <input
                  id="complaint-photo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    setImageError("");
                    const file = e.target.files?.[0] ?? null;
                    if (!file) {
                      setSelectedImageFile(null);
                      setSelectedImageName("");
                      return;
                    }
                    const maxSize = 5 * 1024 * 1024;
                    if (file.size > maxSize) {
                      setSelectedImageFile(null);
                      setSelectedImageName("");
                      setImageError("Image must be 5MB or smaller.");
                      toast.error("Image must be 5MB or smaller.");
                      e.target.value = "";
                      return;
                    }
                    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
                    if (!allowedTypes.includes(file.type)) {
                      setSelectedImageFile(null);
                      setSelectedImageName("");
                      setImageError("Only JPEG, PNG, or WEBP images are allowed.");
                      toast.error("Only JPEG, PNG, or WEBP images are allowed.");
                      e.target.value = "";
                      return;
                    }
                    setSelectedImageFile(file);
                    setSelectedImageName(file.name);
                    setImageError("");
                  }}
                />
                <label
                  htmlFor="complaint-photo-upload"
                  className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400"
                >
                  <div className="text-center text-gray-400">
                    <Camera size={24} className="mx-auto mb-1" />
                    <p className="text-xs">Click to upload photo</p>
                    {selectedImageName && (
                      <p className="mt-1 text-xs text-gray-600">{selectedImageName}</p>
                    )}
                  </div>
                </label>
              </div>
              {imageError && (
                <p className="mt-2 text-sm text-red-600">{imageError}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" type="button"
                onClick={() => {
                  setUnitId("");
                  setCategoryId("");
                  setTitle("");
                  setDescription("");
                  setPriority("MEDIUM");
                  setFormData({ unit_id: undefined, unit_number: undefined, raised_by: undefined });
                  setComplaintType("USER");
                  setResidentSearch("");
                  setMobileValue("");
                  setSelectedResident(null);
                  setSelectedImageFile(null);
                  setSelectedImageName("");
                  setImageError("");
                  setShowDropdown(false);
                }}>
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
