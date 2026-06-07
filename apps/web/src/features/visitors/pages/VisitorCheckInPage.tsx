import { Button, Card, Input, Select } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { visitorsApi } from "@/api/visitors.api";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

export function VisitorCheckInPage() {
  const { queryParams, society } = useScope();
  const qc = useQueryClient();

  const [name, setName]       = useState("");
  const [mobile, setMobile]   = useState("");
  const [unitId, setUnitId]   = useState("");
  const [type, setType]       = useState("GUEST");
  const [purpose, setPurpose] = useState("");
  const [vehicle, setVehicle] = useState("");

  const unitsQuery = useQuery({
    queryKey: ["units-checkin", queryParams.society_id],
    queryFn: () => residentsApi.getUnits({ society_id: queryParams.society_id, page: 1, page_size: 300 }),
    enabled: Boolean(queryParams.society_id),
    retry: false,
  });
  const units = normalizeList<Record<string, unknown>>(unitsQuery.data?.data ?? unitsQuery.data);

  const mutation = useMutation({
    mutationFn: () =>
      visitorsApi.checkIn({
        society_id:     queryParams.society_id ?? society?.society_id ?? 1,
        unit_id:        Number(unitId),
        visitor_name:   name.trim(),
        visitor_mobile: mobile.trim(),
        visitor_type:   type,
        purpose:        purpose.trim() || null,
        vehicle_number: vehicle.trim() || null,
        check_in_at:    new Date().toISOString(),
      }),
    onSuccess: () => {
      toast.success("Visitor checked in successfully");
      qc.invalidateQueries({ queryKey: ["visitors"] });
      setName(""); setMobile(""); setUnitId(""); setPurpose(""); setVehicle(""); setType("GUEST");
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (e as Error)?.message
        ?? "Check-in failed";
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Visitor name is required"); return; }
    if (!mobile.trim()) { toast.error("Mobile number is required"); return; }
    if (!unitId) { toast.error("Please select a unit"); return; }
    mutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / Visitor Check-In</p>
        <h1 className="text-2xl font-bold text-gray-900">Visitor Check-In</h1>
        <p className="mt-1 text-sm text-gray-500">Register visitor entry at the gate</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <h2 className="mb-5 text-base font-semibold text-gray-900">Visitor Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Visitor Name <span className="text-red-500">*</span>
                </label>
                <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <Input placeholder="10-digit mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Visiting Unit <span className="text-red-500">*</span>
                </label>
                <Select value={unitId} onChange={(e) => setUnitId(e.target.value)} required>
                  <option value="">Select unit</option>
                  {units.map((u) => (
                    <option key={String(u.unit_id ?? u.id)} value={String(u.unit_id ?? u.id)}>
                      {String(u.unit_number ?? "-")}
                      {u.block_name ? ` · ${u.block_name}` : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Visitor Type</label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="GUEST">Guest</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="SERVICE">Service</option>
                  <option value="VENDOR">Vendor</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Purpose of Visit</label>
              <Input placeholder="Brief purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Vehicle Number (optional)</label>
              <Input placeholder="KA-01-AB-1234" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" type="button"
                onClick={() => { setName(""); setMobile(""); setUnitId(""); setPurpose(""); setVehicle(""); }}>
                Clear
              </Button>
              <Button className="flex-1" type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? <><Loader2 size={15} className="mr-1 animate-spin" />Checking In…</>
                  : <><UserCheck size={15} className="mr-1" />Check In</>}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex h-48 w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
            <div className="text-gray-400">
              <Camera size={48} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Capture Photo</p>
              <p className="text-xs text-gray-400">Click to open camera</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full">
            <Camera size={15} className="mr-1" />Open Camera
          </Button>
          <p className="text-xs text-gray-400">Photo will be attached to the visitor record</p>
        </Card>
      </div>
    </div>
  );
}
