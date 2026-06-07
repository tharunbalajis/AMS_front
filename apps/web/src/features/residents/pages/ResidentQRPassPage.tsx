import { Button, Card, SearchBox } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Download, QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import { useState } from "react";
import { residentsApi } from "@/api/residents.api";
import { residentsExtApi } from "@/app/api/client";
import { useScope } from "@/app/scope/ScopeProvider";

export function ResidentQRPassPage() {
  const { queryParams } = useScope();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: raw } = useQuery({
    queryKey: ["residents-qr-list", queryParams],
    queryFn: () => residentsApi.getAll({ ...queryParams, page: 1, page_size: 200 }),
    retry: false,
  });
  const all = normalizeList<Record<string, unknown>>(raw?.data ?? raw ?? []);
  const list = all.filter((r) => !search || String(r.full_name ?? "").toLowerCase().includes(search.toLowerCase()));

  const { data: qrData, isLoading: qrLoading } = useQuery({
    queryKey: ["resident-qr", selectedId],
    queryFn: () => residentsExtApi.getQR(selectedId!),
    enabled: Boolean(selectedId),
    retry: false,
  });

  const selected = all.find((r) => String(r.id ?? "") === selectedId);
  const initials = selected ? String(selected.full_name ?? "??").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) : "";

  const handleDownload = () => {
    if (!qrData?.qr_token) return;
    const content = `Resident QR Pass\n================\nName: ${qrData.full_name}\nUnit: ${qrData.unit_number} - ${qrData.block_name}\nQR Token: ${qrData.qr_token}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-pass-${selectedId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Residents / Resident QR Pass</p>
        <h1 className="text-2xl font-bold text-gray-900">Resident QR Pass</h1>
        <p className="mt-1 text-sm text-gray-500">Generate and download resident entry passes</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="flex flex-col gap-3 p-4">
          <SearchBox placeholder="Search resident..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 420 }}>
            {list.map((r) => (
              <button
                key={String(r.id ?? "")}
                type="button"
                onClick={() => setSelectedId(String(r.id ?? ""))}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${selectedId === String(r.id) ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {String(r.full_name ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{String(r.full_name ?? "-")}</p>
                  <p className="text-xs text-gray-500">{String(r.unit_number ?? "")} · {String(r.block_name ?? "")}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div>
          {selectedId && selected ? (
            <Card className="p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                {initials}
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900">{String(qrData?.full_name ?? selected.full_name ?? "-")}</h2>
              <p className="text-sm text-gray-500">{String(qrData?.unit_number ?? selected.unit_number ?? "")} · {String(qrData?.block_name ?? selected.block_name ?? "")}</p>
              <p className="text-sm text-gray-500">{String(selected.mobile_primary ?? "")}</p>

              <div className="mx-auto mt-6 flex items-center justify-center">
                {qrLoading ? (
                  <div className="flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                    <div className="text-gray-400 text-sm">Loading QR…</div>
                  </div>
                ) : qrData?.qr_token ? (
                  <div className="flex flex-col items-center">
                    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6">
                      <QRCode
                        value={String(qrData.qr_token)}
                        size={180}
                        bgColor="#FFFFFF"
                        fgColor="#111827"
                        level="H"
                      />
                    </div>
                    <p className="mt-3 max-w-[220px] truncate text-xs text-gray-500">
                      {String(qrData.qr_token)}
                    </p>
                  </div>
                ) : (
                  <div className="flex h-48 w-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center text-gray-400">
                    <QrCode size={64} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs">QR unavailable</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <Button onClick={handleDownload} disabled={!qrData?.qr_token}>
                  <Download size={15} className="mr-1" />Download Pass
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="flex h-full min-h-[300px] items-center justify-center p-8 text-center">
              <div>
                <QrCode size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="font-medium text-gray-500">Select a resident to generate QR pass</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
