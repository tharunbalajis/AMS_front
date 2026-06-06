import { Button, Card } from "@ams/ui";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

export function BulkImportPage() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith(".csv") || dropped.name.endsWith(".xlsx"))) {
      setFile(dropped);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Residents / Bulk Import</p>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import Residents</h1>
          <p className="mt-1 text-sm text-gray-500">Upload a CSV or Excel file to import multiple residents at once</p>
        </div>
        <Button variant="secondary"><Download size={15} className="mr-1" />Download Template</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="p-6">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }}
          />

          {file ? (
            <div className="flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-6">
              <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                <FileSpreadsheet size={28} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB · Ready to import</p>
              </div>
              <button type="button" onClick={() => setFile(null)} className="rounded-md p-1 text-gray-400 hover:text-red-500">
                <X size={18} />
              </button>
            </div>
          ) : (
            <div
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-16 text-center transition ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="mb-4 rounded-xl bg-gray-100 p-4">
                <Upload size={32} className="text-gray-400" />
              </div>
              <p className="text-base font-semibold text-gray-700">Drag and drop your file here</p>
              <p className="mt-1 text-sm text-gray-500">Supports CSV and Excel files (.csv, .xlsx)</p>
              <Button variant="secondary" className="mt-5" onClick={() => fileRef.current?.click()}>Browse Files</Button>
            </div>
          )}

          {file && (
            <div className="mt-5 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setFile(null)}>Cancel</Button>
              <Button className="flex-1"><Upload size={15} className="mr-1" />Start Import</Button>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900">Import Guidelines</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-500">•</span>Use the provided template for correct column mapping</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-500">•</span>Required: Name, Unit Number, Block, Resident Type</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-500">•</span>Resident Type must be OWNER or TENANT</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-500">•</span>Mobile numbers must be 10 digits</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-500">•</span>Dates in DD-MM-YYYY format</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-500">•</span>Maximum 500 rows per import</li>
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-900">Recent Imports</h3>
            <div className="mt-3 space-y-2">
              {[
                { date: "2024-01-10", count: 45, status: "Success" },
                { date: "2024-01-05", count: 12, status: "Success" },
                { date: "2023-12-28", count: 8, status: "Failed" },
              ].map((imp) => (
                <div key={imp.date} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{imp.date}</p>
                    <p className="text-xs text-gray-500">{imp.count} records</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${imp.status === "Success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {imp.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
