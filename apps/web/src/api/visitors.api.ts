import { http } from "@ams/utils";

export const visitorsApi = {
  getAll: (params?: Record<string, unknown>) => http.get("/visitors", { params }),
  getPasses: (params?: Record<string, unknown>) => http.get("/visitor-passes", { params }),
  getDeliveries: (params?: Record<string, unknown>) => http.get("/delivery-entries", { params }),
  getSosAlerts: (params?: Record<string, unknown>) => http.get("/sos-alerts", { params }),
  checkIn: (data: Record<string, unknown>) => http.post("/visitors", data),
  checkOut: (id: number) => http.put(`/visitors/${id}/checkout`, {}),
  getStaff: (params?: Record<string, unknown>) => http.get("/staff", { params }),
};
