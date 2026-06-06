import { Button, Card, DataTable, Input, Select, StatusBadge } from "@ams/ui";
import { useState } from "react";

const RECENT_MOVES: Record<string, unknown>[] = [
  { id: 1, move_type: "MOVE_IN", resident_name: "Arjun Singh", unit_number: "C-201", move_date: "2024-01-15", notes: "New tenant" },
  { id: 2, move_type: "MOVE_OUT", resident_name: "Deepa Raj", unit_number: "A-304", move_date: "2024-01-12", notes: "Lease expired" },
  { id: 3, move_type: "MOVE_IN", resident_name: "Karan Mehta", unit_number: "B-505", move_date: "2024-01-10", notes: "Owner returning" },
  { id: 4, move_type: "MOVE_OUT", resident_name: "Sunita Sharma", unit_number: "D-208", move_date: "2024-01-08", notes: "Relocated" },
  { id: 5, move_type: "MOVE_IN", resident_name: "Pradeep Nair", unit_number: "C-102", move_date: "2024-01-05", notes: "New resident" },
];

export function MoveInOutPage() {
  const [activeTab, setActiveTab] = useState<"in" | "out">("in");
  const [residentName, setResidentName] = useState("");
  const [unit, setUnit] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Residents / Move-In / Move-Out</p>
        <h1 className="text-2xl font-bold text-gray-900">Move In / Move Out</h1>
        <p className="mt-1 text-sm text-gray-500">Manage resident transitions</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="p-6">
          <div className="mb-5 flex rounded-lg border border-gray-200 p-1">
            <button
              type="button"
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${activeTab === "in" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
              onClick={() => setActiveTab("in")}
            >Move In</button>
            <button
              type="button"
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${activeTab === "out" ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
              onClick={() => setActiveTab("out")}
            >Move Out</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Resident Name</label>
              <Input placeholder="Enter resident name" value={residentName} onChange={(e) => setResidentName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Unit</label>
              <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="">Select unit</option>
                <option value="A-101">A-101</option>
                <option value="B-202">B-202</option>
                <option value="C-305">C-305</option>
                <option value="D-401">D-401</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{activeTab === "in" ? "Move-In Date" : "Move-Out Date"}</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                className="h-20 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" type="button" onClick={() => { setResidentName(""); setUnit(""); setDate(""); setNotes(""); }}>Cancel</Button>
              <Button className="flex-1" type="button">
                {activeTab === "in" ? "Confirm Move-In" : "Confirm Move-Out"}
              </Button>
            </div>
          </div>
        </Card>

        <DataTable
          title="Recent Moves"
          rows={RECENT_MOVES}
          columns={[
            { key: "move_type", header: "TYPE", render: (row) => <StatusBadge value={row.move_type === "MOVE_IN" ? "ACTIVE" : "CLOSED"} /> },
            { key: "resident_name", header: "RESIDENT" },
            { key: "unit_number", header: "UNIT" },
            { key: "move_date", header: "DATE" },
            { key: "notes", header: "NOTES" },
          ]}
        />
      </div>
    </div>
  );
}
