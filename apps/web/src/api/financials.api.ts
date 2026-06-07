import { http } from "@ams/utils";

export const financialsApi = {
  getInvoices: (params?: Record<string, unknown>) => http.get("/invoices", { params }),
  createInvoice: (data: Record<string, unknown>) => http.post("/invoices", data),
  updateInvoice: (id: number, data: Record<string, unknown>) => http.put(`/invoices/${id}`, data),
  getExpenses: (params?: Record<string, unknown>) => http.get("/expenses", { params }),
  createExpense: (data: Record<string, unknown>) => http.post("/expenses", data),
  getExpenseCategories: (params?: Record<string, unknown>) => http.get("/expense-categories", { params }),
  getMaintenanceHeads: (params?: Record<string, unknown>) => http.get("/maintenance-heads", { params }),
};
