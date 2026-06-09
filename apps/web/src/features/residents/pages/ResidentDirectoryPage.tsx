
import {
  Button,
  DataTable,
  SearchBox,
  Select,
  StatusBadge,
} from "@ams/ui";

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  FileDown,
  Loader2,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import { toast } from "sonner";

import { residentsApi } from "@/api/residents.api";

import { useScope } from "@/app/scope/ScopeProvider";

import { useFilterReset } from "@/hooks/useFilterReset";
import { useScopedInvalidate } from "@/hooks/useScopedInvalidate";
import { QK } from "@/lib/queryKeys";

import { BulkActionBar } from "../../shared/components/BulkActionBar";
import { EditResidentModal } from "../components/EditResidentModal";
import ResidentWizard from "../components/ResidentWizard";

/* -------------------------------------------------- */
/* ROW ACTIONS */
/* -------------------------------------------------- */

function RowActions({
  row,
  societyId,
  blockId,
}: {
  row: Record<string, unknown>;
  societyId: number;
  blockId?: number;
}) {

  const [open, setOpen] =
    useState(false);

  const { invalidateAfterResidentChange } = useScopedInvalidate();

  const id = String(
    row.id ?? ""
  );

  const moveOut =
    useMutation({

      mutationFn: () =>
        residentsApi.moveOut(
          id,
          {}
        ),

      onSuccess: async () => {

        toast.success(
          "Resident moved out"
        );

        invalidateAfterResidentChange(societyId, blockId);

        setOpen(false);
      },

      onError: (e: any) => {
        toast.error(e?.response?.data?.message ?? e?.message ?? "Move out failed");
      },
    });

  return (
    <div className="relative">

      <button
        type="button"
        onClick={() =>
          setOpen(!open)
        }
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (

        <div className="absolute right-0 top-7 z-30 w-40 rounded-lg border bg-white shadow-lg">

          <button
            type="button"
            onClick={() => {
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
          >
            Edit
          </button>

          <button
            type="button"
            disabled={moveOut.isPending}
            onClick={() =>
              moveOut.mutate()
            }
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
          >
            Move Out
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/* MAIN PAGE */
/* -------------------------------------------------- */

export function ResidentDirectoryPage() {

  const {
    selectedSocietyId,
    selectedBlockId,
  } = useScope();

  const { invalidateAfterResidentChange } = useScopedInvalidate();

  const societyId = selectedSocietyId;
  const blockId = selectedBlockId;

  /* -------------------------------------------------- */
  /* FILTERS */
  /* -------------------------------------------------- */

  const [search, setSearch] =
    useState("");

  const [type, setType] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [addOpen, setAddOpen] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);

  const [
    editingResident,
    setEditingResident,
  ] = useState<any>(null);

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<string[]>([]);

  const [
    exporting,
    setExporting,
  ] = useState(false);

  /* -------------------------------------------------- */
  /* RESET FILTERS ON SOCIETY CHANGE */
  /* -------------------------------------------------- */

  useFilterReset(societyId, () => {
    setSearch("");
    setType("");
    setStatus("");
    setSelectedIds([]);
  });

  /* -------------------------------------------------- */
  /* QUERY */
  /* -------------------------------------------------- */

  const {
    data,
    isLoading,
  } = useQuery({

    queryKey: [
      ...QK.residents(societyId!, blockId),
      search,
      type,
      status,
    ],

    queryFn: async () => {

      return residentsApi.getAll({

        society_id:
          societyId,

        block_id:
          blockId || undefined,

        page: 1,

        page_size: 100,

        search:
          search || undefined,

        resident_type:
          type || undefined,

        is_active:
          status === "active"
            ? true
            : status === "inactive"
            ? false
            : undefined,
      });
    },

    enabled:
      !!societyId,

    staleTime: 0,

    gcTime: 0,

    retry: 1,
  });

  /* -------------------------------------------------- */
  /* ROWS */
  /* -------------------------------------------------- */

  const rows =
    useMemo(() => {

      const raw =
        Array.isArray(data) ? data : (data as any)?.data ?? [];

      return (Array.isArray(raw) ? raw : []).filter(Boolean);

    }, [data]);

  /* -------------------------------------------------- */
  /* EXPORT */
  /* -------------------------------------------------- */

  const handleExport =
    async () => {

      try {

        setExporting(true);

        await residentsApi.exportCsv(
          societyId
        );

        toast.success(
          "CSV downloaded"
        );

      } catch {

        toast.error(
          "Export failed"
        );

      } finally {

        setExporting(false);
      }
    };

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm text-gray-500">
            Residents / Resident Directory
          </p>

          <h1 className="text-2xl font-bold text-gray-900">
            Resident Directory
          </h1>

          <p className="mt-1 text-sm text-gray-500">

            {isLoading
              ? "Loading residents..."
              : `${(data as any)?.pagination?.total ?? rows.length} residents registered`}
          </p>
        </div>

        <div className="flex gap-2">

          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (

              <Loader2
                size={15}
                className="mr-1 animate-spin"
              />

            ) : (

              <FileDown
                size={15}
                className="mr-1"
              />
            )}

            Export CSV
          </Button>

          <Button
            onClick={() =>
              setAddOpen(true)
            }
          >
            <UserPlus
              size={15}
              className="mr-1"
            />
            Add Resident
          </Button>
        </div>
      </div>

      {/* FILTERS */}

      <div className="flex flex-wrap gap-3">

        <SearchBox
          className="min-w-[280px] flex-1"
          placeholder="Search by name..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <Select
          className="w-44"
          value={type}
          onChange={(e) =>
            setType(
              e.target.value
            )
          }
        >
          <option value="">
            All Types
          </option>

          <option value="OWNER">
            Owner
          </option>

          <option value="TENANT">
            Tenant
          </option>
        </Select>

        <Select
          className="w-44"
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
        >
          <option value="">
            All Status
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </Select>
      </div>

      {/* TABLE */}

      <DataTable
        title="Residents"
        rows={Array.isArray(rows) ? rows : []}
        isLoading={isLoading}
        emptyText={
          isLoading
            ? "Loading residents..."
            : "No residents found"
        }
        columns={[
          {
            key: "full_name",
            header: "NAME",
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

            render: (
              row: any
            ) => (
              <StatusBadge
                value={String(
                  row.resident_type
                )}
              />
            ),
          },

          {
            key: "mobile_primary",
            header: "MOBILE",
          },

          {
            key:
              "__actions" as never,

            header: "",

            render: (
              row: any
            ) => (

              <RowActions
                row={row}
                societyId={societyId!}
                blockId={blockId}
              />
            ),
          },
        ]}
      />

      {/* MODALS */}

      {addOpen && societyId && (
        <ResidentWizard
          societyId={societyId}
          onClose={() => {
            setAddOpen(false);
            invalidateAfterResidentChange(societyId, blockId);
          }}
        />
      )}

      {editOpen &&
        editingResident && (

        <EditResidentModal
          resident={
            editingResident
          }

          onClose={() => {

            setEditOpen(false);

            setEditingResident(null);
          }}
        />
      )}

      {/* BULK ACTIONS */}

      <BulkActionBar
        selectedIds={
          selectedIds
        }

        entityLabel="resident"

        onClearSelection={() =>
          setSelectedIds([])
        }

        actions={[
          {
            label:
              "Export Selected",

            onClick:
              handleExport,
          },
        ]}
      />
    </div>
  );
}
