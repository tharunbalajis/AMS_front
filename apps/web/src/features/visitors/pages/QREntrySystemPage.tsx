import { Button, Card, DataTable, Input, StatusBadge } from "@ams/ui";
import { QrCode } from "lucide-react";
import { useState } from "react";

const TODAY_ENTRIES: Record<string, unknown>[] = [
  { id: 1, visitor: "Raj Verma", unit: "A-101", host: "Aarav Sharma", time: "10:30 AM", mode: "QR" },
  { id: 2, visitor: "Kiran Shah", unit: "D-401", host: "Vijay Mehta", time: "02:00 PM", mode: "QR" },
  { id: 3, visitor: "Sunita Nair", unit: "B-108", host: "Nisha Reddy", time: "01:00 PM", mode: "QR" },
  { id: 4, visitor: "Ramesh Pillai", unit: "C-305", host: "Rahul Kumar", time: "11:45 AM", mode: "PASS" },
];

export function QREntrySystemPage() {
  const [passId, setPassId] = useState("");

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
            <div className="absolute left-2 top-2 h-6 w-6 rounded-tl-lg border-l-3 border-t-3 border-blue-600" />
            <div className="absolute right-2 top-2 h-6 w-6 rounded-tr-lg border-r-3 border-t-3 border-blue-600" />
            <div className="absolute bottom-2 left-2 h-6 w-6 rounded-bl-lg border-b-3 border-l-3 border-blue-600" />
            <div className="absolute bottom-2 right-2 h-6 w-6 rounded-br-lg border-b-3 border-r-3 border-blue-600" />
            <div className="text-center text-gray-300">
              <QrCode size={80} />
              <p className="mt-2 text-xs text-gray-400">Point camera at QR code</p>
            </div>
          </div>
          <Button className="mt-5">
            <QrCode size={15} className="mr-1" />Start Scanner
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Manual Fallback</h2>
          <p className="mb-4 text-sm text-gray-500">Enter the pass ID manually if QR scanner is unavailable</p>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Pass ID</label>
              <Input
                placeholder="e.g. PASS-20240115-001"
                value={passId}
                onChange={(e) => setPassId(e.target.value)}
                className="font-mono"
              />
            </div>
            <Button className="w-full" disabled={!passId}>Verify & Allow Entry</Button>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Scan Result Preview</p>
            <p className="mt-2 text-sm text-gray-400">No pass scanned yet</p>
          </div>
        </Card>
      </div>

      <DataTable
        title="Today's QR Entries"
        rows={TODAY_ENTRIES}
        columns={[
          { key: "visitor", header: "VISITOR" },
          { key: "unit", header: "UNIT" },
          { key: "host", header: "HOST" },
          { key: "time", header: "TIME" },
          { key: "mode", header: "MODE", render: (row) => <StatusBadge value={String(row.mode) === "QR" ? "ACTIVE" : "ASSIGNED"} /> },
        ]}
      />
    </div>
  );
}
