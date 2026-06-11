import type { ApiUser } from "@ams/api-types";
import { resolveRolePermissions } from "@ams/permissions";
import { ACCESS_TOKEN_KEY } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { authApi } from "../api/client";

type AuthContextValue = {
  user?: ApiUser;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user?: ApiUser) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | undefined>();
  // Re-read on every render so changes from the interceptor (clearTokens) are reflected
  const hasToken = Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    // Only fire if there is a token AND we don't already have a hydrated user
    enabled: hasToken && !user,
    retry: false,
    // Don't cache stale sessions — always re-validate on mount
    staleTime: 0,
  });

  const resolvedUser = user ?? query.data;
  const permissions = useMemo(() => resolveRolePermissions(resolvedUser?.role, resolvedUser?.permissions), [resolvedUser]);

  // isAuthenticated is ONLY true when we have an actual resolved user object.
  // Using `hasToken` here would cause protected routes to render while the token
  // is being validated, triggering 401 spam from child queries.
  const isAuthenticated = Boolean(resolvedUser);

  // isLoading covers the brief window between mount and the /auth/me response.
  // RequireAuth shows a spinner during this time instead of redirecting.
  const isLoading = hasToken && !resolvedUser && query.isLoading;

  return (
    <AuthContext.Provider value={{ user: resolvedUser, permissions, isAuthenticated, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
