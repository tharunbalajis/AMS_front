import { http } from "@ams/utils";

export const visitorsApi = {
  // Visitors
  getAll:         (params?: Record<string, unknown>) => http.get("/visitors", { params }),
  getById:        (id: string) => http.get(`/visitors/${id}`),
  createVisitor:  (data: Record<string, unknown>) => http.post("/visitors", data),
  checkIn:        (id: string, data: Record<string, unknown>) => http.put(`/visitors/${id}/checkin`, data),
  checkOut:       (id: string) => http.put(`/visitors/${id}/checkout`, {}),

  // Passes
  getPasses:      (params?: Record<string, unknown>) => http.get("/visitor-passes", { params }),
  addPass:        (data: Record<string, unknown>) => http.post("/visitor-passes", data),
  deactivatePass: (id: string) => http.put(`/visitor-passes/${id}/deactivate`, {}),

  // Invites
  getInvites:     (params?: Record<string, unknown>) => http.get("/visitors/invites", { params }),
  createInvite:   (data: Record<string, unknown>) => http.post("/visitors/invites", data),
  revokeInvite:   (id: string) => http.put(`/visitors/invites/${id}/revoke`, {}),

  // Deliveries
  getDeliveries:   (params?: Record<string, unknown>) => http.get("/delivery-entries", { params }),
  addDelivery:     (data: Record<string, unknown>) => http.post("/delivery-entries", data),
  collectDelivery: (id: string) => http.put(`/delivery-entries/${id}/delivered`, {}),

  // SOS Alerts
  getSosAlerts:   (params?: Record<string, unknown>) => http.get("/sos-alerts", { params }),
  createSosAlert: (data: Record<string, unknown>) => http.post("/sos-alerts", data),
  acknowledgeSos: (id: string) => http.put(`/sos-alerts/${id}/acknowledge`, {}),
  resolveSos:     (id: string, data: Record<string, unknown>) => http.put(`/sos-alerts/${id}/resolve`, data),

  // Staff
  getStaff:    (params?: Record<string, unknown>) => http.get("/staff", { params }),
  addStaff:    (data: Record<string, unknown>) => http.post("/staff", data),
  deleteStaff: (id: string) => http.delete(`/staff/${id}`),

  // Dashboard
  getDashboard: (params?: Record<string, unknown>) => http.get("/visitors/dashboard", { params }),

  // Client-side QR token decoder (no backend round-trip needed)
  verifyQrToken: (qrToken: string): { visitor_id: string; society_id: number; unit_id: number | null } | null => {
    try {
      const [, payloadB64] = qrToken.split(".");
      const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) return null;
      return { visitor_id: payload.visitor_id, society_id: payload.society_id, unit_id: payload.unit_id };
    } catch {
      return null;
    }
  },
};
