import { http } from "@ams/utils";

export const patrolApi = {
  // QR Points
  getQrPoints:       (params?: Record<string, unknown>) => http.get("/patrol/qr-points", { params }),
  createQrPoint:     (data: Record<string, unknown>) => http.post("/patrol/qr-points", data),
  regenerateQrPoint: (id: string) => http.put(`/patrol/qr-points/${id}/regenerate`, {}),

  // Sessions
  startPatrol: () => http.post("/patrol/sessions", {}),
  submitScan:  (sessionId: string, data: Record<string, unknown>) => http.post(`/patrol/sessions/${sessionId}/scan`, data),
  endPatrol:   (sessionId: string) => http.put(`/patrol/sessions/${sessionId}/end`, {}),
  getScanLogs: (sessionId: string) => http.get(`/patrol/sessions/${sessionId}/logs`),

  // Admin
  getDashboard:  (params?: Record<string, unknown>) => http.get("/patrol/dashboard", { params }),
  getHistory:    (params?: Record<string, unknown>) => http.get("/patrol/history", { params }),
  getFraudFlags: (params?: Record<string, unknown>) => http.get("/patrol/fraud-flags", { params }),
};
