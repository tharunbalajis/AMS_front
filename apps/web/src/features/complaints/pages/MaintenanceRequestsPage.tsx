import { Card } from "@ams/ui";

export function MaintenanceRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Complaints / Maintenance Requests</p>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
        <p className="mt-1 text-sm text-gray-500">
          This page is currently under development. You can access all other complaint workflows normally.
        </p>
      </div>

      <Card className="p-6">
        <p className="text-sm text-gray-700">
          The maintenance request page has been restored so the app can resolve the route import.
          Update this page with real maintenance request content when ready.
        </p>
      </Card>
    </div>
  );
}
