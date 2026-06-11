import { Button, Card, DataTable, Input, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { QrCode } from "lucide-react";
import { useState } from "react";
import { visitorsApi } from "@/api/visitors.api";
import { useScope } from "@/app/scope/ScopeProvider";

export function QREntrySystemPage() {
  const { queryParams } = useScope();
  const [passId, setPassId] = useState("");
  const [verified, setVerified] = useState<Record<string, unknown> | null>(null);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["visitor-passes-qr", queryParams],
    queryFn: () => visitorsApi.getPasses({ society_id: queryParams.society_id }),
    retry: false,
  });
  const passes = normalizeList<Record<string, unknown>>(
    (raw as any)?.data?.data?.data ?? (raw as any)?.data?.data ?? raw?.data ?? raw
  );

  const handleVerify = () => {
    const found = passes.find(
      (p) => String(p.id ?? "").includes(passId) || String(p.visitor_name ?? "").toLowerCase().includes(passId.toLowerCase())
    );
    setVerified(found ?? null);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / QR Entry System</p>
        <h1 className="text-2xl font-bold text-gray-900">QR Entry System</h1>
        <p className="mt-1 text-sm text-gray-500">Scan QR code or enter pass ID for gate entry</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="mb-4 text-base font-semibold text-gray-900">QR Scanner</h2>
          <div className="relative flex h-56 w-56 items-center justify-center rounded-xl bg-gray-50">
            <div className="absolute left-2 top-2 h-6 w-6 border-l-2 border-t-2 border-blue-600 rounded-tl" />
            <div className="absolute right-2 top-2 h-6 w-6 border-r-2 border-t-2 border-blue-600 rounded-tr" />
            <div className="absolute bottom-2 left-2 h-6 w-6 border-b-2 border-l-2 border-blue-600 rounded-bl" />
            <div className="absolute bottom-2 right-2 h-6 w-6 border-b-2 border-r-2 border-blue-600 rounded-br" />
            <div className="text-center text-gray-300">
              <QrCode size={80} />
              <p className="mt-2 text-xs text-gray-400">Point camera at QR code</p>
            </div>
          </div>
          <Button className="mt-5"><QrCode size={15} className="mr-1" />Start Scanner</Button>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Manual Lookup</h2>
          <p className="mb-4 text-sm text-gray-500">Enter pass ID or visitor name to verify</p>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Pass ID / Visitor Name</label>
              <Input
                placeholder="e.g. pass ID or visitor name"
                value={passId}
                onChange={(e) => { setPassId(e.target.value); setVerified(null); }}
                className="font-mono"
              />
            </div>
            <Button className="w-full" disabled={!passId.trim()} onClick={handleVerify}>
              Verify &amp; Allow Entry
            </Button>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lookup Result</p>
            {verified ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-semibold text-green-700">Pass Found</p>
                <p className="text-sm text-gray-700">{String(verified.visitor_name ?? "-")}</p>
                <p className="text-xs text-gray-500">
                  Unit {String(verified.unit_number ?? "-")} · Valid {String(verified.valid_from ?? "-")} – {String(verified.valid_until ?? "-")}
                </p>
              </div>
            ) : passId.trim() ? (
              <p className="mt-2 text-sm text-red-500">No matching pass found</p>
            ) : (
              <p className="mt-2 text-sm text-gray-400">No pass scanned yet</p>
            )}
          </div>
        </Card>
      </div>

      <DataTable
        title="Active Passes"
        rows={passes.filter((p) => p.is_active)}
        isLoading={isLoading}
        columns={[
          { key: "visitor_name",  header: "VISITOR" },
          { key: "resident_name", header: "RESIDENT" },
          { key: "unit_number",   header: "UNIT" },
          { key: "valid_from",    header: "FROM" },
          { key: "valid_until",   header: "TO" },
          { key: "pass_purpose",  header: "PURPOSE" },
          {
            key: "is_active", header: "STATUS",
            render: (row) => <StatusBadge value={row.is_active ? "ACTIVE" : "CLOSED"} />,
          },
        ]}
      />
    </div>
  );
}
