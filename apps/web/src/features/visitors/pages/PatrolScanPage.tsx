import { Card } from "@ams/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Play, Square } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { patrolApi } from "@/api/patrol.api";
import { useScope } from "@/app/scope/ScopeProvider";

export function PatrolScanPage() {
  const { queryParams } = useScope();
  const qc = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const startMutation = useMutation({
    mutationFn: () => patrolApi.startPatrol(),
    onSuccess: (res: any) => {
      const session = res?.data?.data ?? res?.data;
      setSessionId(String(session?.id ?? ""));
      toast.success("Patrol session started");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to start patrol"),
  });

  const scanMutation = useMutation({
    mutationFn: () => patrolApi.submitScan(sessionId!, {
      qr_payload:     qrPayload.trim(),
      scan_latitude:  latitude ? Number(latitude) : undefined,
      scan_longitude: longitude ? Number(longitude) : undefined,
    }),
    onSuccess: () => {
      toast.success("Scan submitted");
      qc.invalidateQueries({ queryKey: ["patrol-dashboard"] });
      setQrPayload("");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Scan failed"),
  });

  const endMutation = useMutation({
    mutationFn: () => patrolApi.endPatrol(sessionId!),
    onSuccess: () => {
      toast.success("Patrol session ended");
      qc.invalidateQueries({ queryKey: ["patrol-dashboard"] });
      setSessionId(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to end patrol"),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / Security Patrol Monitoring</p>
        <h1 className="text-2xl font-bold text-gray-900">Patrol Scan</h1>
        <p className="mt-1 text-sm text-gray-500">Start a patrol session and scan QR checkpoints</p>
      </div>

      {!sessionId ? (
        <Card className="p-6 flex flex-col items-center gap-4 max-w-sm mx-auto">
          <Play size={48} className="text-blue-600" />
          <p className="text-gray-600 text-sm text-center">No active patrol session. Start one to begin scanning QR checkpoints.</p>
          <button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 w-full">
            {startMutation.isPending ? "Starting..." : "Start Patrol Session"}
          </button>
        </Card>
      ) : (
        <div className="space-y-4 max-w-lg">
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle size={16} />
            Patrol session active — ID: <span className="font-mono text-xs">{sessionId.slice(0, 8)}...</span>
          </div>

          <Card className="p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Scan QR Point</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">QR Payload (paste or type)</label>
              <input
                className="w-full rounded border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500"
                placeholder="Paste scanned QR payload here"
                value={qrPayload}
                onChange={(e) => setQrPayload(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude (optional)</label>
                <input type="number" step="any" className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude (optional)</label>
                <input type="number" step="any" className="w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </div>
            </div>
            <button onClick={() => scanMutation.mutate()} disabled={!qrPayload.trim() || scanMutation.isPending}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {scanMutation.isPending ? "Submitting..." : "Submit Scan"}
            </button>
          </Card>

          <button onClick={() => endMutation.mutate()} disabled={endMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
            <Square size={14} />
            {endMutation.isPending ? "Ending..." : "End Patrol Session"}
          </button>
        </div>
      )}
    </div>
  );
}
