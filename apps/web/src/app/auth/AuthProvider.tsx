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
  const hasToken = Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    enabled: hasToken && !user,
    retry: false
  });

  const resolvedUser = user ?? query.data;
  const permissions = useMemo(() => resolveRolePermissions(resolvedUser?.role, resolvedUser?.permissions), [resolvedUser]);

  return (
    <AuthContext.Provider value={{ user: resolvedUser, permissions, isAuthenticated: Boolean(resolvedUser || hasToken), isLoading: query.isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
