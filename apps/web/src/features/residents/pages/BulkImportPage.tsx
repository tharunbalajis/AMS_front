import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { residentsApi } from "../../../api/residents.api";
import { useScope } from "../../../app/scope/ScopeProvider";
import { CheckCircle, Download, Upload, AlertCircle, Loader2 } from "lucide-react";

type Step = "upload" | "preview" | "confirm";

const CSV_HEADERS = ["full_name", "mobile", "email", "block_name", "unit_number", "floor_number", "resident_type", "move_in_date", "move_out_date", "is_active"];

function downloadTemplate() {
  const sample = [
    CSV_HEADERS.join(","),
    "John Doe,9999999999,john@example.com,Block A,101,1,OWNER,2024-01-01,,true",
    "Jane Tenant,8888888888,jane@example.com,Block B,202,2,TENANT,2024-02-01,2025-01-31,true",
  ].join("\r\n");
  const blob = new Blob([sample], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "residents_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  });
}

export function BulkImportPage() {
  const { society } = useScope();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [validRows, setValidRows] = useState<Record<string, unknown>[]>([]);
  const [invalidRows, setInvalidRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");
  const [done, setDone] = useState<{ inserted: number } | null>(null);

  void society;

  const previewMutation = useMutation({
    mutationFn: (rows: Record<string, string>[]) =>
      residentsApi.importPreview(rows as unknown as Record<string, unknown>[]),
    onSuccess: ({ data }) => {
      setValidRows(data.valid ?? []);
      setInvalidRows(data.invalid ?? []);
      setStep("preview");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (rows: Record<string, unknown>[]) => residentsApi.importConfirm(rows),
    onSuccess: ({ data }) => {
      setDone({ inserted: data.inserted });
      setStep("confirm");
      queryClient.invalidateQueries({ queryKey: ["residents"] });
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const rows = parseCsv(ev.target?.result as string);
      setRawRows(rows);
    };
    reader.readAsText(file);
  };

  const handlePreview = () => {
    if (rawRows.length === 0) return;
    previewMutation.mutate(rawRows);
  };

  const handleConfirm = () => {
    confirmMutation.mutate(validRows);
  };

  const reset = () => {
    setStep("upload");
    setRawRows([]);
    setValidRows([]);
    setInvalidRows([]);
    setFileName("");
    setDone(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const stepBadge = (n: number, label: string, active: boolean) => (
    <div className={`flex items-center gap-2 ${active ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>{n}</span>
      <span className="text-sm">{label}</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bulk Import Residents</h1>
          <p className="text-sm text-gray-500 mt-1">Upload a CSV to import residents in bulk</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download size={15} /> Download Template
        </button>
      </div>

      <div className="flex items-center gap-6 rounded-xl border border-gray-200 bg-white px-6 py-4">
        {stepBadge(1, "Upload CSV", step === "upload")}
        <div className="h-px flex-1 bg-gray-200" />
        {stepBadge(2, "Preview & Validate", step === "preview")}
        <div className="h-px flex-1 bg-gray-200" />
        {stepBadge(3, "Done", step === "confirm")}
      </div>

      {step === "upload" && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <Upload size={32} className="mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 mb-1">Drag & drop or click to select a CSV file</p>
          <p className="text-xs text-gray-400 mb-4">Required columns: full_name, mobile, block_name, unit_number, resident_type</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} id="csv-upload" />
          <label htmlFor="csv-upload" className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Upload size={15} /> Choose File
          </label>
          {fileName && (
            <div className="mt-4 text-sm text-gray-600">
              Selected: <span className="font-medium">{fileName}</span> — {rawRows.length} data rows
            </div>
          )}
          {rawRows.length > 0 && (
            <button
              onClick={handlePreview}
              disabled={previewMutation.isPending}
              className="mt-4 flex mx-auto items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {previewMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
              Validate & Preview
            </button>
          )}
          {previewMutation.isError && (
            <p className="mt-3 text-sm text-red-600">Validation failed. Please try again.</p>
          )}
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{validRows.length}</p>
              <p className="text-xs text-green-600 font-medium">Valid rows</p>
            </div>
            <div className="flex-1 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{invalidRows.length}</p>
              <p className="text-xs text-red-600 font-medium">Invalid rows (skipped)</p>
            </div>
          </div>

          {invalidRows.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-red-100 bg-red-50">
                <AlertCircle size={15} className="text-red-600" />
                <p className="text-sm font-semibold text-red-700">Rows with errors</p>
              </div>
              <div className="overflow-x-auto max-h-48">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Row</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidRows.map((r: Record<string, unknown>, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-500">{String(r._row ?? "")}</td>
                        <td className="px-3 py-2">{String(r.full_name ?? "—")}</td>
                        <td className="px-3 py-2 text-red-600">{(r._errors as string[])?.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {validRows.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <CheckCircle size={15} className="text-green-600" />
                <p className="text-sm font-semibold text-gray-700">Valid rows — will be imported</p>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      {["Name", "Mobile", "Block", "Unit", "Type", "Move-in"].map(h => (
                        <th key={h} className="px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.map((r: Record<string, unknown>, i) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{String(r.full_name ?? "")}</td>
                        <td className="px-3 py-2">{String(r.mobile_primary ?? "")}</td>
                        <td className="px-3 py-2">{String(r._block_name ?? "")}</td>
                        <td className="px-3 py-2">{String(r._unit_number ?? "")}</td>
                        <td className="px-3 py-2">{String(r.resident_type ?? "")}</td>
                        <td className="px-3 py-2">{String(r.move_in_date ?? "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={reset} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Start Over
            </button>
            <button
              onClick={handleConfirm}
              disabled={validRows.length === 0 || confirmMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {confirmMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
              Import {validRows.length} Residents
            </button>
          </div>
        </div>
      )}

      {step === "confirm" && done && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-10 text-center space-y-4">
          <CheckCircle size={48} className="mx-auto text-green-600" />
          <h2 className="text-xl font-bold text-green-800">Import Complete!</h2>
          <p className="text-sm text-green-700">{done.inserted} residents imported successfully.</p>
          <button onClick={reset} className="rounded-lg bg-white border border-green-300 px-5 py-2 text-sm font-medium text-green-700 hover:bg-green-50">
            Import More
          </button>
        </div>
      )}
    </div>
  );
}
