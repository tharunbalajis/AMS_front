
import { Button, DataTable, SearchBox, Select, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

type ResidentForm = {
  full_name: string;
  email: string;
  mobile_primary: string;
  resident_type: "OWNER" | "TENANT";
  unit_id: string;
  move_in_date: string;
  move_out_date: string;
};

const EMPTY_FORM: ResidentForm = {
  full_name: "",
  email: "",
  mobile_primary: "",
  resident_type: "OWNER",
  unit_id: "",
  move_in_date: "",
  move_out_date: "",
};

function AddResidentModal({
  societyId,
  onClose,
}: {
  societyId: number;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const [form, setForm] = useState<ResidentForm>(EMPTY_FORM);

  const unitsQuery = useQuery({
    queryKey: ["units", societyId],
    queryFn: () =>
      residentsApi.getUnits({
        society_id: societyId,
        page: 1,
        page_size: 200,
      }),
  });

  const units = normalizeList<Record<string, unknown>>(
    unitsQuery.data?.data ?? unitsQuery.data
  );

  const mutation = useMutation({
    mutationFn: () =>
      residentsApi.create({
        society_id: societyId,
        unit_id: Number(form.unit_id),
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        mobile_primary: form.mobile_primary.trim(),
        resident_type: form.resident_type,
        move_in_date: form.move_in_date,
        move_out_date: form.move_out_date || null,
        is_active: true,
      }),

    onSuccess: () => {
      toast.success("Resident added successfully");

      qc.invalidateQueries({
        queryKey: ["residents"],
      });

      onClose();
    },

    onError: (err: Error) => {
      toast.error(err.message || "Failed to add resident");
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
              <UserPlus size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Add New Resident
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

            Add Resident
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResidentDirectoryPage() {
  const { queryParams, society } = useScope();

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["residents", queryParams, search, type, status],

    queryFn: () =>
      residentsApi.getAll({
        ...queryParams,
        page: 1,
        page_size: 100,
        search: search || undefined,
        resident_type: type || undefined,
      }),

    retry: false,
  });

  const rows = (() => {
    const fetched = normalizeList<Record<string, unknown>>(
      raw?.data ?? raw
    );

    let list = fetched ?? [];

    if (search) {
      list = list.filter((r) =>
        String(r.full_name ?? "")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    if (type) {
      list = list.filter(
        (r) => String(r.resident_type ?? "") === type
      );
    }

    if (status === "active") {
      list = list.filter((r) => Boolean(r.is_active));
    }

    if (status === "inactive") {
      list = list.filter((r) => !Boolean(r.is_active));
    }

    return list;
  })();

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-sm text-gray-500">
            Residents / Resident Directory
          </p>

          <h1 className="text-2xl font-bold text-gray-900">
            Resident Directory
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {rows.length} residents registered
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="secondary">
            <Download size={15} className="mr-1" />
            Import
          </Button>

          <Button onClick={() => setAddOpen(true)}>
            <UserPlus size={15} className="mr-1" />
            Add Resident
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">

        <SearchBox
          className="min-w-[280px] flex-1"
          placeholder="Search by name, unit, mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select
          className="w-44"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="OWNER">Owner</option>
          <option value="TENANT">Tenant</option>
        </Select>

        <Select
          className="w-44"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <DataTable
        title="Residents"
        rows={rows.map((row, index) => ({
          ...row,
          __rowKey:
            row.id ||
            row.resident_id ||
            row.email ||
            index,
        }))}
        isLoading={isLoading}
        columns={[
          {
            key: "full_name",
            header: "NAME",

            render: (row) => (
              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {String(row.full_name ?? "?")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div>
                  <p className="font-medium text-gray-900">
                    {String(row.full_name ?? "-")}
                  </p>

                  <p className="text-xs text-gray-500">
                    {String(row.email ?? "")}
                  </p>
                </div>
              </div>
            ),
          },

          {
            key: "unit_number",
            header: "UNIT",
          },

          {
            key: "block_name",
            header: "BLOCK",
          },

          {
            key: "resident_type",
            header: "TYPE",
            render: (row) => (
              <StatusBadge value={row.resident_type} />
            ),
          },

          {
            key: "is_active",
            header: "STATUS",
            render: (row) => (
              <StatusBadge
                value={row.is_active ? "ACTIVE" : "INACTIVE"}
              />
            ),
          },

          {
            key: "mobile_primary",
            header: "MOBILE",
          },

          {
            key: "move_in_date",
            header: "MOVE-IN",
          },
        ]}
      />

      {addOpen && (
        <AddResidentModal
          societyId={society?.society_id ?? 1}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

