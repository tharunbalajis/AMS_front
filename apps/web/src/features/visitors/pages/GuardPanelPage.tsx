import { Button, Card, SearchBox } from "@ams/ui";
import { AlertTriangle, Clock, UserCheck } from "lucide-react";
import { useState } from "react";

const RECENT_ENTRIES = [
  { id: 1, name: "Raj Verma", unit: "A-101", type: "GUEST", time: "2 min ago", color: "bg-blue-500" },
  { id: 2, name: "Delivery – Amazon", unit: "B-202", type: "DELIVERY", time: "8 min ago", color: "bg-amber-500" },
  { id: 3, name: "Meera Singh (Maid)", unit: "C-305", type: "SERVICE", time: "15 min ago", color: "bg-purple-500" },
  { id: 4, name: "Kiran Shah", unit: "D-401", type: "GUEST", time: "22 min ago", color: "bg-blue-500" },
  { id: 5, name: "Plumber", unit: "A-204", type: "SERVICE", time: "35 min ago", color: "bg-purple-500" },
];

export function GuardPanelPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / Guard Panel</p>
        <h1 className="text-2xl font-bold text-gray-900">Guard Panel</h1>
        <p className="mt-1 text-sm text-gray-500">Gate entry management for security personnel</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBox className="min-w-[260px] flex-1" placeholder="Search visitor, unit, host..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button><UserCheck size={15} className="mr-1" />Manual Entry</Button>
        <Button variant="danger"><AlertTriangle size={15} className="mr-1" />SOS Alert</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Recent Entries</h2>
          <div className="space-y-3">
            {RECENT_ENTRIES.filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.unit.toLowerCase().includes(search.toLowerCase())).map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 rounded-lg border border-gray-100 px-4 py-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${entry.color}`}>
                  {entry.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-900">{entry.name}</p>
                  <p className="text-xs text-gray-500">Unit {entry.unit} · {entry.type}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  {entry.time}
                </div>
                <Button variant="secondary" className="h-8 px-3 text-xs">Exit</Button>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900">Gate Status</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-700">Main Gate</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Open</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-700">Side Gate</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Closed</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-700">Parking Gate</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Open</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-900">Shift Info</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Current Guard</span><span className="font-medium">Suresh Yadav</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shift</span><span className="font-medium">Morning (06:00 – 14:00)</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Clock In</span><span className="font-medium">06:05 AM</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Entries Today</span><span className="font-medium">47</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
