import { http } from "@ams/utils";

export const visitorsApi = {
  getAll:       (params?: Record<string, unknown>) => http.get("/visitors", { params }),
  getPasses:    (params?: Record<string, unknown>) => http.get("/visitor-passes", { params }),
  getDeliveries:(params?: Record<string, unknown>) => http.get("/delivery-entries", { params }),
  getSosAlerts: (params?: Record<string, unknown>) => http.get("/sos-alerts", { params }),
  getStaff:     (params?: Record<string, unknown>) => http.get("/staff", { params }),

  checkIn:    (data: Record<string, unknown>) => http.post("/visitors", data),
  checkOut:   (id: string) => http.put(`/visitors/${id}/checkout`, {}),

  addPass:        (data: Record<string, unknown>) => http.post("/visitor-passes", data),
  deactivatePass: (id: string) => http.put(`/visitor-passes/${id}/deactivate`, {}),

  addDelivery:     (data: Record<string, unknown>) => http.post("/delivery-entries", data),
  collectDelivery: (id: string) => http.put(`/delivery-entries/${id}/delivered`, {}),

  acknowledgeSos: (id: string) => http.put(`/sos-alerts/${id}/acknowledge`, {}),
  resolveSos:     (id: string, data: Record<string, unknown>) => http.put(`/sos-alerts/${id}/resolve`, data),

  addStaff:    (data: Record<string, unknown>) => http.post("/staff", data),
  deleteStaff: (id: string) => http.delete(`/staff/${id}`),
};
