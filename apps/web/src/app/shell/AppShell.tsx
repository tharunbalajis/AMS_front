import { Button, Select } from "@ams/ui";
import { Bell, Building2, ChevronDown, LogOut, Menu, Moon, Search, Sun, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { authApi, scopeApi } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { useScope } from "../scope/ScopeProvider";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "../../features/shared/components/CommandPalette";
import { FeatureErrorBoundary } from "../../features/shared/components/FeatureErrorBoundary";

export function AppShell() {
  const { user, setUser } = useAuth();
  const { society, block, setSociety, setBlock } = useScope();
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const societies = useQuery({ queryKey: ["societies"], queryFn: scopeApi.societies });
  const blocks = useQuery({ queryKey: ["blocks", society?.society_id], queryFn: () => scopeApi.blocks(society?.society_id), enabled: Boolean(society?.society_id) });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 text-gray-950 dark:bg-gray-950 dark:text-gray-50">
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} societyId={society?.society_id} />
      <Sidebar collapsed={collapsed} onLogout={() => authApi.logout().then(() => setUser(undefined))} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 h-14 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
          <div className="flex h-full items-center justify-between gap-4 px-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setCollapsed((value) => !value)}
                title="Toggle sidebar"
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0 text-sm">
                <span className="font-semibold text-gray-900 dark:text-gray-50">AMS</span>
                <span className="mx-2 text-gray-300">/</span>
                <span className="truncate capitalize text-gray-500">{pageTitle(location.pathname)}</span>
              </div>
            </div>
            <div className="hidden min-w-0 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 md:flex">
              <Building2 size={15} className="text-blue-600" />
              <Select className="h-7 min-w-[150px] border-0 bg-transparent px-0 py-0 focus:ring-0" value={society?.society_id ?? ""} onChange={(event) => setSociety(societies.data?.find((item) => item.society_id === Number(event.target.value)))}>
                {societies.data?.map((item) => <option key={item.society_id} value={item.society_id}>{item.society_name}</option>)}
              </Select>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <Select className="hidden h-9 w-40 md:block" value={block?.block_id ?? ""} onChange={(event) => setBlock(blocks.data?.find((item) => item.block_id === Number(event.target.value)))}>
                <option value="">All blocks</option>
                {blocks.data?.map((item) => <option key={item.block_id} value={item.block_id}>{item.block_name}</option>)}
              </Select>
              <label className="relative hidden sm:block">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input className="h-9 w-56 rounded-md border border-gray-200 bg-white pl-9 pr-14 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 cursor-pointer" placeholder="Search" readOnly onClick={() => setPaletteOpen(true)} />
                <span className="absolute right-2 top-2 rounded border border-gray-200 bg-gray-50 px-1.5 text-[10px] font-semibold text-gray-500">Ctrl K</span>
              </label>
              <div className="relative">
                <button type="button" className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50" title="Notifications" onClick={() => setNotifOpen(v => !v)}>
                  <Bell size={16} />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-11 z-30 w-72 rounded-lg border border-gray-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                      <span className="text-sm font-semibold text-gray-900">Notifications</span>
                      <button type="button" className="text-xs text-gray-500 hover:text-gray-700" onClick={() => setNotifOpen(false)}>Dismiss</button>
                    </div>
                    <div className="px-4 py-6 text-center text-sm text-gray-500">No new notifications</div>
                  </div>
                )}
              </div>
              <Button variant="secondary" className="h-9 w-9 px-0" title="Toggle theme" onClick={() => setDark((value) => !value)}>{dark ? <Sun size={16} /> : <Moon size={16} />}</Button>
              <div className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 lg:flex">
                <UserCircle size={22} className="text-blue-600" />
                <div className="min-w-0">
                  <p className="max-w-28 truncate text-xs font-semibold text-gray-900">{user?.full_name ?? user?.email ?? "Admin"}</p>
                  <p className="text-[11px] text-gray-500 capitalize">{(user?.role ?? "admin").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <FeatureErrorBoundary key={location.pathname}>
            <Outlet />
          </FeatureErrorBoundary>
        </main>
        <footer className="flex flex-col gap-2 px-6 pb-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Signed in as {user?.email ?? "session user"}</span>
          <button className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white" onClick={() => authApi.logout().then(() => setUser(undefined))}><LogOut size={14} /> Logout</button>
        </footer>
      </div>
    </div>
  );
}

function pageTitle(pathname: string) {
  if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
  return pathname.slice(1).split("/").join(" / ").replaceAll("-", " ");
}
