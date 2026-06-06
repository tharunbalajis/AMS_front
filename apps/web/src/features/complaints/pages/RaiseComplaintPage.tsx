import { Button, Card, Input, Select } from "@ams/ui";
import { Camera, Send } from "lucide-react";
import { useState } from "react";

export function RaiseComplaintPage() {
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUnit(""); setCategory(""); setTitle(""); setDescription(""); setPriority("MEDIUM");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Complaints / Raise Complaint</p>
        <h1 className="text-2xl font-bold text-gray-900">Raise a Complaint</h1>
        <p className="mt-1 text-sm text-gray-500">Submit a new complaint for review and resolution</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Unit <span className="text-red-500">*</span></label>
                <Select value={unit} onChange={(e) => setUnit(e.target.value)} required>
                  <option value="">Select your unit</option>
                  <option value="A-101">A-101</option>
                  <option value="B-202">B-202</option>
                  <option value="C-305">C-305</option>
                  <option value="D-401">D-401</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label>
                <Select value={category} onChange={(e) => setCategory(e.target.value)} required>
                  <option value="">Select category</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Security">Security</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Amenities">Amenities</option>
                  <option value="Others">Others</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Complaint Title <span className="text-red-500">*</span></label>
              <Input placeholder="Brief summary of the issue" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
              <textarea
                className="h-28 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
              <div className="flex gap-2">
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 rounded-md border py-2 text-xs font-semibold transition ${
                      priority === p
                        ? p === "CRITICAL" ? "border-red-500 bg-red-500 text-white"
                          : p === "HIGH" ? "border-orange-500 bg-orange-500 text-white"
                          : p === "MEDIUM" ? "border-yellow-500 bg-yellow-500 text-white"
                          : "border-gray-500 bg-gray-500 text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Attach Photo (optional)</label>
              <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400">
                <div className="text-center text-gray-400">
                  <Camera size={24} className="mx-auto mb-1" />
                  <p className="text-xs">Click to upload photo</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" type="button">Cancel</Button>
              <Button className="flex-1" type="submit"><Send size={15} className="mr-1" />Submit Complaint</Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900">SLA Guidelines</h3>
            <div className="mt-3 space-y-3">
              {[
                { priority: "Critical", sla: "4 hours", color: "text-red-600" },
                { priority: "High", sla: "24 hours", color: "text-orange-600" },
                { priority: "Medium", sla: "48 hours", color: "text-yellow-600" },
                { priority: "Low", sla: "72 hours", color: "text-gray-600" },
              ].map((item) => (
                <div key={item.priority} className="flex items-center justify-between text-sm">
                  <span className={`font-semibold ${item.color}`}>{item.priority}</span>
                  <span className="text-gray-500">Response within {item.sla}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900">Complaint Process</h3>
            <ol className="mt-3 space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="font-bold text-blue-600">1.</span> Submit complaint with details</li>
              <li className="flex gap-2"><span className="font-bold text-blue-600">2.</span> Management reviews and assigns</li>
              <li className="flex gap-2"><span className="font-bold text-blue-600">3.</span> Assigned staff resolves the issue</li>
              <li className="flex gap-2"><span className="font-bold text-blue-600">4.</span> You receive resolution notification</li>
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
