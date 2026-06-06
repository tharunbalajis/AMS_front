import { http } from "@ams/utils";

export const financialsApi = {
  getInvoices: (params?: Record<string, unknown>) => http.get("/invoices", { params }),
  getExpenses: (params?: Record<string, unknown>) => http.get("/expenses", { params }),
  createInvoice: (data: Record<string, unknown>) => http.post("/invoices", data),
  updateInvoice: (id: number, data: Record<string, unknown>) => http.put(`/invoices/${id}`, data),
};
