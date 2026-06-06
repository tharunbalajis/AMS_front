import { Button, Card } from "@ams/ui";
import { BarChart2, Download, FileBarChart, FileText, PieChart, TrendingUp } from "lucide-react";

const REPORTS = [
  { title: "Monthly Revenue Report", description: "Detailed breakdown of all income sources for the current month.", icon: TrendingUp, color: "bg-blue-100 text-blue-700", last: "Jan 2024" },
  { title: "Collection Summary", description: "Summary of payments collected vs outstanding across all units.", icon: BarChart2, color: "bg-green-100 text-green-700", last: "Jan 2024" },
  { title: "Expense Statement", description: "All society expenses categorized by department and vendor.", icon: FileText, color: "bg-amber-100 text-amber-700", last: "Jan 2024" },
  { title: "GST Filing Report", description: "GST collected on maintenance charges ready for filing.", icon: FileBarChart, color: "bg-purple-100 text-purple-700", last: "Q3 2023-24" },
  { title: "Defaulter Report", description: "Residents with overdue payments and outstanding amounts.", icon: PieChart, color: "bg-red-100 text-red-700", last: "Jan 2024" },
  { title: "Annual Finance Summary", description: "Year-to-date revenue, expenses, and balance sheet overview.", icon: FileBarChart, color: "bg-gray-100 text-gray-700", last: "FY 2023-24" },
];

export function FinancialReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Finance / Financial Reports</p>
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="mt-1 text-sm text-gray-500">Generate and download society financial reports</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => (
          <Card key={report.title} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2.5 ${report.color}`}>
                <report.icon size={20} />
              </div>
              <span className="text-xs text-gray-400">{report.last}</span>
            </div>
            <h3 className="mt-3 font-semibold text-gray-900">{report.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{report.description}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1 text-xs h-8">Preview</Button>
              <Button className="flex-1 text-xs h-8"><Download size={12} className="mr-1" />Download</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
