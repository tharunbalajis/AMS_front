import { Button, Card, Input, Select } from "@ams/ui";
import { Camera, UserCheck } from "lucide-react";
import { useState } from "react";

export function VisitorCheckInPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [unit, setUnit] = useState("");
  const [type, setType] = useState("GUEST");
  const [purpose, setPurpose] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setName(""); setMobile(""); setUnit(""); setPurpose("");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / Visitor Check-In</p>
        <h1 className="text-2xl font-bold text-gray-900">Visitor Check-In</h1>
        <p className="mt-1 text-sm text-gray-500">Register visitor entry at the gate</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <h2 className="mb-5 text-base font-semibold text-gray-900">Visitor Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Visitor Name <span className="text-red-500">*</span></label>
                <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
                <Input placeholder="10-digit mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Visiting Unit <span className="text-red-500">*</span></label>
                <Select value={unit} onChange={(e) => setUnit(e.target.value)} required>
                  <option value="">Select unit</option>
                  <option value="A-101">A-101 · Aarav Sharma</option>
                  <option value="B-202">B-202 · Priya Patel</option>
                  <option value="C-305">C-305 · Rahul Kumar</option>
                  <option value="D-401">D-401 · Vijay Mehta</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Visitor Type</label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="GUEST">Guest</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="SERVICE">Service</option>
                  <option value="VENDOR">Vendor</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Purpose of Visit</label>
              <Input placeholder="Brief purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Vehicle Number (optional)</label>
              <Input placeholder="KA-01-AB-1234" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" type="button">Cancel</Button>
              <Button className="flex-1" type="submit">
                <UserCheck size={15} className="mr-1" />Check In
              </Button>
            </div>
          </form>
        </Card>

        <Card className="flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex h-48 w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
            <div className="text-gray-400">
              <Camera size={48} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Capture Photo</p>
              <p className="text-xs text-gray-400">Click to open camera</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full">
            <Camera size={15} className="mr-1" />Open Camera
          </Button>
          <p className="text-xs text-gray-400">Photo will be attached to the visitor record</p>
        </Card>
      </div>
    </div>
  );
}
