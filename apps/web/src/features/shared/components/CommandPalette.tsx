import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchApi } from "../../../app/api/client";
import { Search, X } from "lucide-react";

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  type: "resident" | "unit" | "complaint";
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  societyId?: number;
}

export function CommandPalette({ open, onClose, societyId }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchApi.search(query, societyId);
        const items: SearchResult[] = [
          ...(data.residents ?? []).map((r: Record<string, unknown>) => ({
            id: `r-${r.id}`,
            label: String(r.full_name ?? ""),
            sublabel: `${r.block_name ?? ""} / ${r.unit_number ?? ""} · ${((() => { const s = String(r.resident_type ?? "").toUpperCase(); return s === 'FAMILY' ? 'OWNER' : s; })())}`,
            href: `/residents/${r.id}`,
            type: "resident" as const,
          })),
          ...(data.units ?? []).map((u: Record<string, unknown>) => ({
            id: `u-${u.unit_id}`,
            label: `${u.block_name ?? ""} / ${u.unit_number ?? ""}`,
            sublabel: u.is_occupied ? "Occupied" : "Vacant",
            href: `/residents/units/${u.unit_id}`,
            type: "unit" as const,
          })),
          ...(data.complaints ?? []).map((c: Record<string, unknown>) => ({
            id: `c-${c.complaint_id}`,
            label: String(c.title ?? ""),
            sublabel: `Status: ${c.status ?? ""}`,
            href: `/complaints/${c.complaint_id}`,
            type: "complaint" as const,
          })),
        ];
        setResults(items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, societyId]);

  if (!open) return null;

  const typeColors: Record<string, string> = {
    resident: "bg-blue-100 text-blue-700",
    unit: "bg-green-100 text-green-700",
    complaint: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
            placeholder="Search residents, units, complaints…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") onClose(); }}
          />
          {loading && <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>

        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map(item => (
              <li key={item.id}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
                  onClick={() => { navigate(item.href); onClose(); }}
                >
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${typeColors[item.type]}`}>
                    {item.type}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                    {item.sublabel && <p className="text-xs text-gray-500 truncate">{item.sublabel}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-gray-500">No results for "{query}"</p>
        )}

        {query.length < 2 && (
          <p className="px-4 py-4 text-xs text-gray-400 text-center">Type at least 2 characters to search</p>
        )}
      </div>
    </div>
  );
}
