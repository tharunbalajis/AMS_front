import { useState } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";


import { toast } from "sonner";

import { residentsApi } from "../../../api/residents.api";
import { normalizeList } from "@ams/utils";

import { Loader2, User, UserPlus, X } from "lucide-react";
type ResidentForm = {
  unit_id: string;
  full_name: string;
  email: string;
  mobile_primary: string;
  resident_type: "OWNER" | "TENANT";
  move_in_date: string;
  move_out_date: string;
};
export function EditResidentModal({
  resident,
  onClose,
}: {
  resident: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const mapResidentType = (v: unknown) => {
    const s = String(v ?? "").toUpperCase();
    return s === "FAMILY" ? "OWNER" : s;
  };

  const [form, setForm] = useState<ResidentForm>({
    unit_id: String(resident.unit_id ?? ""),
    full_name: resident.full_name ?? "",
    email: resident.email ?? "",
    mobile_primary: resident.mobile_primary ?? resident.mobile ?? "",
    resident_type: mapResidentType(resident.resident_type ?? "OWNER") as "OWNER" | "TENANT",
    move_in_date: resident.move_in_date?.slice(0, 10) ?? "",
    move_out_date: resident.move_out_date?.slice(0, 10) ?? "",
    });

  const unitsQuery = useQuery({
    queryKey: ["units", resident.society_id],
    queryFn: () =>
      residentsApi.getUnits({
        society_id: resident.society_id,
        page: 1,
        page_size: 200,
      }),
  });

  const units = normalizeList<Record<string, unknown>>(
    unitsQuery.data?.data ?? unitsQuery.data
  );

  const mutation = useMutation({
    mutationFn: () =>
        residentsApi.update(
        resident.id || resident.resident_id,
        {
            unit_id: Number(form.unit_id),
            full_name: form.full_name.trim(),
            email: form.email.trim() || null,
            mobile_primary: form.mobile_primary.trim(),
            resident_type: form.resident_type,
            move_in_date: form.move_in_date,
            move_out_date: form.move_out_date || null,
        }),

    onSuccess: () => {
      toast.success("Resident updated successfully");

      qc.invalidateQueries({
        queryKey: ["residents"],
      });

      onClose();
    },

    onError: (err: Error) => {
      toast.error(err.message || "Failed to update resident");
    },
  });

  const isValid =
    form.full_name.trim() &&
    form.mobile_primary.trim() &&
    form.unit_id &&
    form.move_in_date;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <User size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Edit Resident
              </h2>

              <p className="text-xs text-gray-500">
                Fill in the resident details below
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6">

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </span>

            <input
              value={form.full_name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  full_name: e.target.value,
                }))
              }
              placeholder="e.g. Ravi Kumar"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Mobile
              </span>

              <input
                value={form.mobile_primary}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    mobile_primary: e.target.value,
                  }))
                }
                placeholder="9876543210"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </span>

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    email: e.target.value,
                  }))
                }
                placeholder="resident@email.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Unit
              </span>

              <select
                value={form.unit_id}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    unit_id: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Select unit</option>

                {units.map((u, index) => (
                  <option
                    key={
                      String(
                        u.id ||
                          u.unit_id ||
                          u.unit_number ||
                          index
                      )
                    }
                    value={String(u.id || u.unit_id || "")}
                  >
                    {String(u.unit_number ?? u.id ?? "-")}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Type
              </span>

              <select
                value={form.resident_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    resident_type: e.target.value as "OWNER" | "TENANT",
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="OWNER">Owner</option>
                <option value="TENANT">Tenant</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Move-in Date
              </span>

              <input
                type="date"
                value={form.move_in_date}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    move_in_date: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>

            {form.resident_type === "TENANT" && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Move-out Date
                </span>

                <input
                  type="date"
                  value={form.move_out_date}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      move_out_date: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!isValid || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white"
          >
            {mutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <UserPlus size={15} />
            )}

            Update Resident
          </button>
        </div>
      </div>
    </div>
  );
}
