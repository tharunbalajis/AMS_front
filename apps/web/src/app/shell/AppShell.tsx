import { Button, Select } from "@ams/ui";

import {
  Bell,
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  UserCircle,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import {
  authApi,
  scopeApi,
} from "../api/client";

import { useAuth } from "../auth/AuthProvider";

import { useScope } from "../scope/ScopeProvider";

import { Sidebar } from "./Sidebar";

import { CommandPalette } from "../../features/shared/components/CommandPalette";

import { FeatureErrorBoundary } from "../../features/shared/components/FeatureErrorBoundary";

import { ACCESS_TOKEN_KEY, normalizeList } from "@ams/utils";

export function AppShell() {

  const { user, setUser } =
    useAuth();

  const {
    society,
    block,
    setSociety,
    setBlock,
  } = useScope();

  const [dark, setDark] =
    useState(false);

  const [collapsed, setCollapsed] =
    useState(false);

  const [paletteOpen, setPaletteOpen] =
    useState(false);

  const [notifOpen, setNotifOpen] =
    useState(false);

  const scopeInitialized = useRef(false);

  const location = useLocation();

  const societiesQuery = useQuery({

    queryKey: ["societies"],

    queryFn:
      scopeApi.societies,

  });

  const blocksQuery = useQuery({

    queryKey: [
      "blocks",
      society?.society_id,
    ],

    queryFn: () =>
      scopeApi.blocks(
        society?.society_id
      ),

    enabled:
      Boolean(
        society?.society_id
      ),

  });

  const societies =
    normalizeList<any>(
      societiesQuery.data
    );

  const blocks =
    normalizeList<any>(
      blocksQuery.data
    );

  useEffect(() => {

    document.documentElement
      .classList.toggle(
        "dark",
        dark
      );

  }, [dark]);

  useEffect(() => {

    const handler = (
      e: KeyboardEvent
    ) => {

      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "k"
      ) {

        e.preventDefault();

        setPaletteOpen(
          (v) => !v
        );
      }
    };

    window.addEventListener(
      "keydown",
      handler
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handler
      );

  }, []);

  useEffect(() => {

    if (
      !societiesQuery.isSuccess ||
      societies.length === 0 ||
      scopeInitialized.current
    ) return;

    // On page refresh, user comes from authApi.me query asynchronously.
    // Wait until user resolves before initializing scope, otherwise we'd
    // default to society[0] instead of the logged-in user's society.
    if (!user && Boolean(localStorage.getItem(ACCESS_TOKEN_KEY))) return;

    scopeInitialized.current = true;

    const target = user?.society_id
      ? (societies.find(
          (s) => s.society_id === user.society_id
        ) ?? societies[0])
      : societies[0];

    setSociety(target);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [societiesQuery.data, user]);

  return (

    <div className="flex h-screen overflow-hidden bg-gray-100 text-gray-900 dark:bg-[#0f172a] dark:text-gray-100">

      <CommandPalette
        open={paletteOpen}
        onClose={() =>
          setPaletteOpen(false)
        }
        societyId={
          society?.society_id
        }
      />

      <Sidebar
        collapsed={collapsed}
        onLogout={() =>
          authApi
            .logout()
            .then(() =>
              setUser(undefined)
            )
        }
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        <header className="sticky top-0 z-20 h-14 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111827]">

          <div className="flex h-full items-center justify-between gap-4 px-4 lg:px-6">

            <div className="flex min-w-0 items-center gap-3">

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"

                onClick={() =>
                  setCollapsed(
                    (value) => !value
                  )
                }
              >

                <Menu size={18} />

              </button>

              <div className="min-w-0 text-sm">

                <span className="font-semibold text-gray-900 dark:text-white">
                  AMS
                </span>

                <span className="mx-2 text-gray-400">
                  /
                </span>

                <span className="truncate capitalize text-gray-500 dark:text-gray-400">

                  {pageTitle(
                    location.pathname
                  )}

                </span>

              </div>

            </div>

            <div className="hidden min-w-0 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-[#1e293b] dark:text-gray-200 md:flex">

              <Building2
                size={15}
                className="text-blue-500"
              />

              <Select
                className="h-7 min-w-[170px] border-0 bg-transparent px-0 py-0 text-sm focus:ring-0 dark:bg-transparent dark:text-white"

                value={
                  society?.society_id ??
                  ""
                }

                onChange={(event) =>
                  setSociety(

                    societies.find(
                      (item) =>
                        item.society_id ===
                        Number(
                          event.target.value
                        )
                    )

                  )
                }
              >

                {societies.map(
                  (item) => (

                    <option
                      key={
                        item.society_id
                      }
                      value={
                        item.society_id
                      }
                    >

                      {item.society_name}

                    </option>

                  )
                )}

              </Select>

              <ChevronDown
                size={14}
                className="text-gray-400"
              />

            </div>

            <div className="flex min-w-0 items-center gap-2">

              <Select
                className="hidden h-9 w-40 border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1e293b] dark:text-white md:block"

                value={
                  block?.block_id ??
                  ""
                }

                onChange={(event) =>
                  setBlock(

                    blocks.find(
                      (item) =>
                        item.block_id ===
                        Number(
                          event.target.value
                        )
                    )

                  )
                }
              >

                <option value="">
                  All blocks
                </option>

                {blocks.map(
                  (item) => (

                    <option
                      key={
                        item.block_id
                      }
                      value={
                        item.block_id
                      }
                    >

                      {item.block_name}

                    </option>

                  )
                )}

              </Select>

              <label className="relative hidden sm:block">

                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />

                <input
                  className="h-9 w-56 rounded-md border border-gray-200 bg-white pl-9 pr-14 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-[#1e293b] dark:text-white dark:placeholder:text-gray-400 cursor-pointer"

                  placeholder="Search"

                  readOnly

                  onClick={() =>
                    setPaletteOpen(true)
                  }
                />

                <span className="absolute right-2 top-2 rounded border border-gray-200 bg-gray-50 px-1.5 text-[10px] font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">

                  Ctrl K

                </span>

              </label>

              <div className="relative">

                <button
                  type="button"
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-[#1e293b] dark:text-gray-300 dark:hover:bg-gray-800"

                  onClick={() =>
                    setNotifOpen(
                      (v) => !v
                    )
                  }
                >

                  <Bell size={16} />

                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />

                </button>

              </div>

              <Button
                variant="secondary"
                className="h-9 w-9 border border-gray-200 bg-white px-0 dark:border-gray-700 dark:bg-[#1e293b]"

                onClick={() =>
                  setDark(
                    (value) => !value
                  )
                }
              >

                {dark ? (
                  <Sun size={16} />
                ) : (
                  <Moon size={16} />
                )}

              </Button>

              <div className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-[#1e293b] lg:flex">

                <UserCircle
                  size={22}
                  className="text-blue-500"
                />

                <div className="min-w-0">

                  <p className="max-w-28 truncate text-xs font-semibold text-gray-900 dark:text-white">

                    {user?.full_name ??
                      user?.email ??
                      "Admin"}

                  </p>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400">

                    Super Admin

                  </p>

                </div>

              </div>

            </div>

          </div>

        </header>

        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 dark:bg-[#0f172a] lg:p-6">

          <FeatureErrorBoundary
            key={location.pathname}
          >

            <Outlet />

          </FeatureErrorBoundary>

        </main>

        <footer className="flex flex-col gap-2 border-t border-gray-200 bg-white px-6 py-4 text-xs text-gray-500 dark:border-gray-700 dark:bg-[#111827] dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">

          <span>

            Signed in as{" "}
            {user?.email ??
              "session user"}

          </span>

          <button
            className="inline-flex items-center gap-1 text-gray-600 transition hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"

            onClick={() =>
              authApi
                .logout()
                .then(() =>
                  setUser(undefined)
                )
            }
          >

            <LogOut size={14} />

            Logout

          </button>

        </footer>

      </div>

    </div>
  );
}

function pageTitle(
  pathname: string
) {

  if (
    pathname === "/" ||
    pathname === "/dashboard"
  ) {

    return "Dashboard";
  }

  return pathname
    .slice(1)
    .split("/")
    .join(" / ")
    .replaceAll("-", " ");
}