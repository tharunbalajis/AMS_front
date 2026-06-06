import { clsx, type ClassValue } from "clsx";
import { ArrowDownUp, Download, MoreHorizontal, Search } from "lucide-react";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
    ghost: "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  return <button className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50", styles[variant], className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100", className)} {...props}>{children}</select>;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900", className)} {...props} />;
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200", className)}>{children}</span>;
}

export function StatusBadge({ value }: { value: unknown }) {
  const label = String(value ?? "ACTIVE").toUpperCase();
  const normalized = label.replaceAll(" ", "_");
  const tone =
    ["ACTIVE", "PAID", "PRESENT", "RESOLVED"].some((item) => normalized.includes(item)) ? "green" :
    ["OVERDUE", "BREACHED", "ABSENT", "CRITICAL"].some((item) => normalized.includes(item)) ? "red" :
    ["PENDING", "EXPIRING", "LATE", "WARNING", "OPEN"].some((item) => normalized.includes(item)) ? "amber" :
    ["IN_PROGRESS", "ON_TRACK", "INSIDE", "CHECKED_IN", "ASSIGNED"].some((item) => normalized.includes(item)) ? "blue" :
    ["CLOSED", "EXITED", "COLLECTED", "CHECKED_OUT", "INACTIVE"].some((item) => normalized.includes(item)) ? "gray" :
    "green";
  const styles = {
    green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200",
    red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
  };
  const dots = {
    green: "bg-green-500",
    red: "bg-red-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    gray: "bg-gray-500"
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[tone])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[tone])} />
      {label}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-800", className)} />;
}

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
};

export function DataTable<T extends Record<string, unknown>>({ title, rows, columns, isLoading, emptyText = "No records found" }: { title: string; rows: T[]; columns: Column<T>[]; isLoading?: boolean; emptyText?: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <div>
          <h2 className="text-base font-semibold text-gray-950 dark:text-gray-50">{title}</h2>
          <p className="text-sm text-gray-500">Live backend data with filtering, export, and row actions ready.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" title="Sort"><ArrowDownUp size={16} /></Button>
          <Button variant="secondary" title="Export"><Download size={16} /></Button>
          <Button variant="ghost" title="Actions"><MoreHorizontal size={16} /></Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950 dark:text-gray-400">
            <tr>{columns.map((column) => <th key={String(column.key)} className="px-4 py-3 font-semibold">{column.header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>{columns.map((column) => <td key={String(column.key)} className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>)}</tr>
              ))
            ) : rows.length ? (
              rows.map((row, index) => (
                <tr key={String(row.id ?? index)} className="h-12 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  {columns.map((column) => <td key={String(column.key)} className="px-4 py-3 text-gray-700 dark:text-gray-200">{column.render ? column.render(row) : String(row[column.key] ?? "-")}</td>)}
                </tr>
              ))
            ) : (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-gray-500">{emptyText}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function SearchBox(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={16} />
      <Input className="pl-9" {...props} />
    </label>
  );
}
