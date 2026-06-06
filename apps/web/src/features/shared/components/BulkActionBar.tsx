import { X } from "lucide-react";

export interface BulkAction {
  label: string;
  onClick: (selectedIds: string[]) => void;
  variant?: "default" | "danger";
}

interface BulkActionBarProps {
  selectedIds: string[];
  actions: BulkAction[];
  onClearSelection: () => void;
  entityLabel?: string;
}

export function BulkActionBar({ selectedIds, actions, onClearSelection, entityLabel = "item" }: BulkActionBarProps) {
  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl bg-gray-900 text-white px-4 py-3 shadow-2xl border border-gray-700">
      <span className="text-sm font-medium">
        {selectedIds.length} {entityLabel}{selectedIds.length !== 1 ? "s" : ""} selected
      </span>
      <div className="h-4 w-px bg-gray-600" />
      {actions.map(action => (
        <button
          key={action.label}
          onClick={() => action.onClick(selectedIds)}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
            action.variant === "danger"
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          }`}
        >
          {action.label}
        </button>
      ))}
      <button
        onClick={onClearSelection}
        className="ml-1 text-gray-400 hover:text-white"
        title="Clear selection"
      >
        <X size={16} />
      </button>
    </div>
  );
}
