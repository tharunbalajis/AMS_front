import { Button, DataTable, SearchBox, StatusBadge } from "@ams/ui";

import { normalizeList } from "@ams/utils";

import { useQuery } from "@tanstack/react-query";

import {
  FilePlus,
  Pencil,
} from "lucide-react";

import { useState } from "react";

import { residentsApi } from "@/api/residents.api";

import { useScope } from "@/app/scope/ScopeProvider";

import { LeaseModal } from "../components/LeaseModal";

export function LeaseAgreementsPage() {

  const { queryParams } = useScope();

  const [search, setSearch] =
    useState("");

  const [showLeaseModal, setShowLeaseModal] =
    useState(false);

  const [editingLease, setEditingLease] =
    useState<any>(null);

  const {
    data: raw,
    isLoading,
  } = useQuery({

    queryKey: [
      "leases",
      queryParams,
      search,
    ],

    queryFn: () =>
      residentsApi.getLeases({
        ...queryParams,
        search:
          search || undefined,
      }),

    retry: false,
  });

  // Backend returns a plain array; normalizeList handles the axios wrapper
  const rows =
    normalizeList<any>(raw);

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

        <Button
          onClick={() => {

            setEditingLease(null);

            setShowLeaseModal(true);

          }}
        >

          <FilePlus
            size={15}
            className="mr-1"
          />

          New Lease

        </Button>

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

              <button

                onClick={() => {

                  console.log(
                    "EDIT ROW => ",
                    row
                  );

                  setEditingLease({

                    lease_id:
                      row.lease_id,

                    tenant_resident_id:
                      row.tenant_resident_id,

                    full_name:
                      row.full_name,

                    lease_start:
                      row.lease_start,

                    lease_end:
                      row.lease_end,

                    monthly_rent:
                      row.monthly_rent,

                  });

                  setShowLeaseModal(
                    true
                  );

                }}

                className="rounded-lg p-2 hover:bg-gray-100"
              >

                <Pencil size={16} />

              </button>

            ),
          },

        ]}
      />

      {showLeaseModal && (

        <LeaseModal

          lease={editingLease}

          onClose={() => {

            setShowLeaseModal(
              false
            );

            setEditingLease(
              null
            );

          }}

        />

      )}

    </div>
  );
}