import { useState } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "sonner";

import {
  X,
  Loader2,
} from "lucide-react";

import { residentsApi } from "@/api/residents.api";

import { normalizeList } from "@ams/utils";

export function LeaseModal({
  lease,
  onClose,
}: {
  lease?: any;
  onClose: () => void;
}) {

  const queryClient =
    useQueryClient();

  console.log(
    "LEASE DATA => ",
    lease
  );

  const leaseId =
    lease?.lease_id;

  const [form, setForm] =
    useState({

      resident_id:
        lease?.tenant_resident_id ??
        "",

      lease_start:
        lease?.lease_start
          ? String(
              lease.lease_start
            ).slice(0, 10)
          : "",

      lease_end:
        lease?.lease_end
          ? String(
              lease.lease_end
            ).slice(0, 10)
          : "",

      rent_monthly:
        lease?.monthly_rent ??
        "",

    });

  const residentsQuery =
    useQuery({

      queryKey: [
        "tenant-residents",
      ],

      queryFn: () =>
        residentsApi.getAll({
          resident_type:
            "TENANT",
          page: 1,
          page_size: 200,
        }),

    });

  const residents =
    normalizeList<any>(
      residentsQuery.data?.data ??
      residentsQuery.data
    );

  const mutation =
    useMutation({

      mutationFn: async () => {

        const payload = {

          resident_id:
            form.resident_id,

          lease_start:
            form.lease_start,

          lease_end:
            form.lease_end,

          rent_monthly:
            Number(
              form.rent_monthly
            ),

        };

        console.log(
          "LEASE ID => ",
          leaseId
        );

        console.log(
          "PAYLOAD => ",
          payload
        );

        if (leaseId) {

          return residentsApi.updateLease(
            String(leaseId),
            payload
          );
        }

        return residentsApi.createLease(
          payload
        );
      },

      onSuccess: async () => {

        toast.success(
          leaseId
            ? "Lease updated successfully"
            : "Lease created successfully"
        );

        await queryClient.invalidateQueries({
          queryKey: ["leases"],
        });

        onClose();
      },

      onError: (err: any) => {

        console.error(
          "LEASE ERROR => ",
          err
        );

        toast.error(
          err?.response?.data?.message ??
          err?.message ??
          "Lease request failed"
        );
      },

    });

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b px-6 py-4">

          <h2 className="text-lg font-semibold">

            {leaseId
              ? "Edit Lease"
              : "New Lease"}

          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100"
          >

            <X size={18} />

          </button>

        </div>

        <div className="space-y-4 p-6">

          <label className="block">

            <span className="mb-1 block text-sm font-medium">
              Tenant
            </span>

            <select
              value={form.resident_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  resident_id:
                    e.target.value,
                })
              }
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >

              <option value="">
                Select tenant
              </option>

              {residents.map(
                (
                  r: any,
                  index: number
                ) => (

                  <option
                    key={
                      r.id ??
                      index
                    }
                    value={String(
                      r.id
                    )}
                  >

                    {String(
                      r.full_name
                    )}

                  </option>

                )
              )}

            </select>

          </label>

          <div className="grid grid-cols-2 gap-4">

            <label className="block">

              <span className="mb-1 block text-sm font-medium">
                Lease Start
              </span>

              <input
                type="date"
                value={
                  form.lease_start
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    lease_start:
                      e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />

            </label>

            <label className="block">

              <span className="mb-1 block text-sm font-medium">
                Lease End
              </span>

              <input
                type="date"
                value={
                  form.lease_end
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    lease_end:
                      e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />

            </label>

          </div>

          <label className="block">

            <span className="mb-1 block text-sm font-medium">
              Monthly Rent
            </span>

            <input
              type="number"
              value={
                form.rent_monthly
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  rent_monthly:
                    e.target.value,
                })
              }
              placeholder="25000"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />

          </label>

        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">

          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            disabled={
              mutation.isPending
            }
            onClick={() =>
              mutation.mutate()
            }
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white"
          >

            {mutation.isPending && (

              <Loader2
                size={14}
                className="animate-spin"
              />

            )}

            {leaseId
              ? "Update Lease"
              : "Create Lease"}

          </button>

        </div>

      </div>

    </div>
  );
}