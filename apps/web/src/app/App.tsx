import { hasPermission, type Permission } from "@ams/permissions";
import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import { ScopeProvider } from "./scope/ScopeProvider";
import { AppShell } from "./shell/AppShell";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { AuditLogsPage } from "../features/audit-logs/pages/AuditLogsPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { EXTRA_MODULE_ROUTES, MODULE_ROUTES } from "../features/registry";
import { ResourcePage } from "../features/shared/pages/ResourcePage";
import { SettingsPage } from "../features/settings/pages/SettingsPage";
import { RolesPage } from "../features/roles/pages/RolesPage";

// Resident pages
import { ResidentDirectoryPage } from "../features/residents/pages/ResidentDirectoryPage";
import { ResidentOverviewPage } from "../features/residents/pages/ResidentOverviewPage";
import { UnitManagementPage } from "../features/residents/pages/UnitManagementPage";
import { BlockWingPage } from "../features/residents/pages/BlockWingPage";
import { LeaseAgreementsPage } from "../features/residents/pages/LeaseAgreementsPage";
import { VehicleManagementPage } from "../features/residents/pages/VehicleManagementPage";
import { PetManagementPage } from "../features/residents/pages/PetManagementPage";
import { MoveInOutPage } from "../features/residents/pages/MoveInOutPage";
import { ResidentQRPassPage } from "../features/residents/pages/ResidentQRPassPage";
import { BulkImportPage } from "../features/residents/pages/BulkImportPage";

// Visitor pages
import { SecurityDashboardPage } from "../features/visitors/pages/SecurityDashboardPage";
import { VisitorCheckInPage } from "../features/visitors/pages/VisitorCheckInPage";
import { VisitorLogsPage } from "../features/visitors/pages/VisitorLogsPage";
import { GuardPanelPage } from "../features/visitors/pages/GuardPanelPage";
import { QREntrySystemPage } from "../features/visitors/pages/QREntrySystemPage";
import { DeliveryTrackingPage } from "../features/visitors/pages/DeliveryTrackingPage";
import { StaffAttendancePage } from "../features/visitors/pages/StaffAttendancePage";
import { SosEmergencyPage } from "../features/visitors/pages/SosEmergencyPage";
import { GuestPassesPage } from "../features/visitors/pages/GuestPassesPage";

// Complaint pages
import { ComplaintDashboardPage } from "../features/complaints/pages/ComplaintDashboardPage";
import { RaiseComplaintPage } from "../features/complaints/pages/RaiseComplaintPage";
import { ComplaintTrackingPage } from "../features/complaints/pages/ComplaintTrackingPage";
import { SLAMonitoringPage } from "../features/complaints/pages/SLAMonitoringPage";
import { EscalationQueuePage } from "../features/complaints/pages/EscalationQueuePage";
import { MaintenanceRequestsPage } from "../features/complaints/pages/MaintenanceRequestsPage";
import { ComplaintAnalyticsPage } from "../features/complaints/pages/ComplaintAnalyticsPage";

// Finance pages
import { FinanceDashboardPage } from "../features/financials/pages/FinanceDashboardPage";
import { InvoicesPage } from "../features/financials/pages/InvoicesPage";
import { PaymentsPage } from "../features/financials/pages/PaymentsPage";
import { ExpenseTrackingPage } from "../features/financials/pages/ExpenseTrackingPage";
import { GSTReportsPage } from "../features/financials/pages/GSTReportsPage";
import { PenaltyManagementPage } from "../features/financials/pages/PenaltyManagementPage";
import { FinancialReportsPage } from "../features/financials/pages/FinancialReportsPage";

// Slugs that have custom page components (skip ResourcePage for these)
const CUSTOM_SLUGS = new Set([
  "roles", "users",
  "residents", "residents/overview", "residents/leases", "residents/vehicles", "residents/pets",
  "residents/move", "residents/qr-pass", "residents/import",
  "units", "blocks",
  "visitors/security", "visitors/checkin", "visitors/logs", "visitors/guard", "visitors/qr",
  "visitors/deliveries", "visitors/attendance", "visitors/sos", "visitors/passes",
  "complaints/dashboard", "complaints/new", "complaints", "complaints/sla",
  "complaints/escalation", "complaints/maintenance", "complaints/analytics",
  "financials", "financials/invoices", "financials/payments", "financials/expenses",
  "financials/gst", "financials/penalties", "financials/reports",
]);

function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading AMS...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PermissionRoute({ permission, children }: { permission: Permission; children: ReactElement }) {
  const { permissions } = useAuth();
  return hasPermission(permissions, permission) ? children : <Navigate to="/dashboard" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <ScopeProvider>
              <AppShell />
            </ScopeProvider>
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<PermissionRoute permission="dashboard.view"><DashboardPage /></PermissionRoute>} />
        <Route path="settings" element={<PermissionRoute permission="settings.manage"><SettingsPage /></PermissionRoute>} />
        <Route path="audit-logs" element={<PermissionRoute permission="audit-logs.view"><AuditLogsPage /></PermissionRoute>} />
        <Route path="roles" element={<PermissionRoute permission="roles.view"><RolesPage /></PermissionRoute>} />
        <Route path="users" element={<PermissionRoute permission="users.view"><RolesPage /></PermissionRoute>} />

        {/* ── Resident custom routes ── */}
        <Route path="residents" element={<PermissionRoute permission="residents.view"><ResidentDirectoryPage /></PermissionRoute>} />
        <Route path="residents/overview" element={<PermissionRoute permission="residents.view"><ResidentOverviewPage /></PermissionRoute>} />
        <Route path="residents/leases" element={<PermissionRoute permission="residents.view"><LeaseAgreementsPage /></PermissionRoute>} />
        <Route path="residents/vehicles" element={<PermissionRoute permission="residents.view"><VehicleManagementPage /></PermissionRoute>} />
        <Route path="residents/pets" element={<PermissionRoute permission="residents.view"><PetManagementPage /></PermissionRoute>} />
        <Route path="residents/move" element={<PermissionRoute permission="residents.view"><MoveInOutPage /></PermissionRoute>} />
        <Route path="residents/qr-pass" element={<PermissionRoute permission="residents.view"><ResidentQRPassPage /></PermissionRoute>} />
        <Route path="residents/import" element={<PermissionRoute permission="residents.view"><BulkImportPage /></PermissionRoute>} />

        {/* ── Unit / Block custom routes ── */}
        <Route path="units" element={<PermissionRoute permission="units.view"><UnitManagementPage /></PermissionRoute>} />
        <Route path="blocks" element={<PermissionRoute permission="blocks.view"><BlockWingPage /></PermissionRoute>} />

        {/* ── Visitor custom routes ── */}
        <Route path="visitors/security" element={<PermissionRoute permission="visitors.view"><SecurityDashboardPage /></PermissionRoute>} />
        <Route path="visitors/checkin" element={<PermissionRoute permission="visitors.view"><VisitorCheckInPage /></PermissionRoute>} />
        <Route path="visitors/logs" element={<PermissionRoute permission="visitors.view"><VisitorLogsPage /></PermissionRoute>} />
        <Route path="visitors/guard" element={<PermissionRoute permission="visitors.view"><GuardPanelPage /></PermissionRoute>} />
        <Route path="visitors/qr" element={<PermissionRoute permission="visitors.view"><QREntrySystemPage /></PermissionRoute>} />
        <Route path="visitors/deliveries" element={<PermissionRoute permission="visitors.view"><DeliveryTrackingPage /></PermissionRoute>} />
        <Route path="visitors/attendance" element={<PermissionRoute permission="visitors.view"><StaffAttendancePage /></PermissionRoute>} />
        <Route path="visitors/sos" element={<PermissionRoute permission="visitors.view"><SosEmergencyPage /></PermissionRoute>} />
        <Route path="visitors/passes" element={<PermissionRoute permission="visitors.view"><GuestPassesPage /></PermissionRoute>} />

        {/* ── Complaint custom routes ── */}
        <Route path="complaints/dashboard" element={<PermissionRoute permission="complaints.view"><ComplaintDashboardPage /></PermissionRoute>} />
        <Route path="complaints/new" element={<PermissionRoute permission="complaints.view"><RaiseComplaintPage /></PermissionRoute>} />
        <Route path="complaints" element={<PermissionRoute permission="complaints.view"><ComplaintTrackingPage /></PermissionRoute>} />
        <Route path="complaints/sla" element={<PermissionRoute permission="complaints.view"><SLAMonitoringPage /></PermissionRoute>} />
        <Route path="complaints/escalation" element={<PermissionRoute permission="complaints.view"><EscalationQueuePage /></PermissionRoute>} />
        <Route path="complaints/maintenance" element={<PermissionRoute permission="complaints.view"><MaintenanceRequestsPage /></PermissionRoute>} />
        <Route path="complaints/analytics" element={<PermissionRoute permission="complaints.view"><ComplaintAnalyticsPage /></PermissionRoute>} />

        {/* ── Finance custom routes ── */}
        <Route path="financials" element={<PermissionRoute permission="finance.view"><FinanceDashboardPage /></PermissionRoute>} />
        <Route path="financials/invoices" element={<PermissionRoute permission="finance.view"><InvoicesPage /></PermissionRoute>} />
        <Route path="financials/payments" element={<PermissionRoute permission="finance.view"><PaymentsPage /></PermissionRoute>} />
        <Route path="financials/expenses" element={<PermissionRoute permission="finance.view"><ExpenseTrackingPage /></PermissionRoute>} />
        <Route path="financials/gst" element={<PermissionRoute permission="finance.view"><GSTReportsPage /></PermissionRoute>} />
        <Route path="financials/penalties" element={<PermissionRoute permission="finance.view"><PenaltyManagementPage /></PermissionRoute>} />
        <Route path="financials/reports" element={<PermissionRoute permission="finance.view"><FinancialReportsPage /></PermissionRoute>} />

        {/* ── Generic ResourcePage for all remaining registry routes ── */}
        {[...MODULE_ROUTES, ...EXTRA_MODULE_ROUTES]
          .filter((module) => !CUSTOM_SLUGS.has(module.slug))
          .map((module) => (
            <Route
              key={module.slug}
              path={module.slug}
              element={
                <PermissionRoute permission={`${module.permission}.view` as Permission}>
                  <ResourcePage module={module} />
                </PermissionRoute>
              }
            />
          ))}
      </Route>
    </Routes>
  );
}
