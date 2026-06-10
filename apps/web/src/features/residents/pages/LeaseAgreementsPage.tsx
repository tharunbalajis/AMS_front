import { Button, DataTable, SearchBox, StatusBadge } from "@ams/ui";

import { normalizeList } from "@ams/utils";

import { useQuery } from "@tanstack/react-query";

import { Pencil } from "lucide-react";

import { useState } from "react";

import { residentsApi } from "@/api/residents.api";

import { useScope } from "@/app/scope/ScopeProvider";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function LeaseAgreementsPage() {

  const { queryParams, selectedSocietyId } = useScope();
  const societyId = selectedSocietyId;

  const [search, setSearch] =
    useState("");

  const qc = useQueryClient();

  const { data: raw, isLoading } = useQuery({

    queryKey: [
      "leases",
      queryParams,
      search,
    ],

    queryFn: () =>
      residentsApi.getLeases({
        ...queryParams,
        search: search || undefined,
      }),

    enabled: !!societyId,
    retry: false,
  });

  // Backend returns a plain array; normalizeList handles the axios wrapper
  const rows =
    normalizeList<any>(raw);

  const endLeaseMut = useMutation({
    mutationFn: async ({ leaseId, residentId }: { leaseId: string; residentId: string }) => {
      const today = new Date().toISOString().slice(0,10);
      return residentsApi.endLeaseAndMoveOut(String(residentId), String(leaseId), today);
    },
    onSuccess: () => { toast.success('Lease ended and tenant moved out'); qc.invalidateQueries({ queryKey: ['leases'] }); qc.invalidateQueries({ queryKey: ['residents'] }); },
    onError: (e: any) => { toast.error((e as any)?.response?.data?.message ?? (e as Error)?.message ?? 'Operation failed'); }
  });

  if (!societyId) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <p>Select a society to view lease agreements.</p>
      </div>
    );
  }

  return (

    <div className="space-y-6">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm text-gray-500">
            Residents / Lease Agreements
          </p>

          <h1 className="text-2xl font-bold text-gray-900">
            Lease Agreements
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {rows.length} active lease records
          </p>

        </div>

        {/* Read-only listing: lease creation handled from Resident wizard */}

      </div>

      <SearchBox
        className="max-w-md"
        placeholder="Search tenant, unit..."
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
      />

      <DataTable
        title="Lease Records"
        rows={rows}
        isLoading={isLoading}

        columns={[

          {
            key: "full_name",

            header: "TENANT",

            render: (row) => (

              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">

                  {String(
                    row.full_name ?? "?"
                  )
                    .slice(0, 2)
                    .toUpperCase()}

                </div>

                <span className="font-medium">

                  {String(
                    row.full_name ?? "-"
                  )}

                </span>

              </div>

            ),
          },

          {
            key: "unit_number",

            header: "UNIT",
          },

          {
            key: "lease_start",

            header: "START",

            render: (row) => (

              row.lease_start
                ? new Date(
                    row.lease_start
                  ).toLocaleDateString(
                    "en-GB"
                  )
                : "-"

            ),
          },

          {
            key: "lease_end",

            header: "END",

            render: (row) => (

              row.lease_end
                ? new Date(
                    row.lease_end
                  ).toLocaleDateString(
                    "en-GB"
                  )
                : "-"

            ),
          },

          {
            key: "days_remaining",
            header: "DAYS REMAINING",
            render: (row) => {
              const leaseEnd = row.lease_end ?? row.end ?? null;
              if (!leaseEnd) return <span>-</span>;
              const days = Math.ceil((new Date(String(leaseEnd)).getTime() - new Date().getTime()) / 86400000);
              return <span>{days >= 0 ? `${days} days` : 'Expired'}</span>;
            }
          },

          {
            key: "monthly_rent",

            header: "RENT / MO",

            render: (row) => (

              <span className="font-medium">

                ₹

                {Number(
                  row.monthly_rent ?? 0
                ).toLocaleString(
                  "en-IN"
                )}

              </span>

            ),
          },

          {
            key: "lease_status",

            header: "STATUS",

            render: (row) => (

              <StatusBadge
                value={String(
                  row.lease_status ??
                  "ACTIVE"
                )}
              />

            ),
          },

          {
            key: "actions",
            header: "",
            render: (row) => (
              <div className="flex items-center gap-2">
                <button className="rounded-lg p-2 text-sm hover:bg-gray-50" onClick={() => endLeaseMut.mutate({ leaseId: String(row.lease_id ?? row.id ?? ''), residentId: String(row.tenant_resident_id ?? '') })}>
                  End Lease
                </button>
              </div>
            ),
          },

        ]}
      />

      {/* Lease creation and editing removed from this read-only view */}

    </div>
  );
}