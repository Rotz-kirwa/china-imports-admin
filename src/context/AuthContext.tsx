import { createContext, useContext, useEffect, useState } from "react";
import { ADMIN_TOKEN_KEY, adminApi, type AdminSessionUser } from "@/lib/api";

type AuthContextValue = {
  token: string | null;
  user: AdminSessionUser | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<AdminSessionUser>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const [user, setUser] = useState<AdminSessionUser | null>(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(ADMIN_TOKEN_KEY)));

  function clearSession() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  async function refresh() {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await adminApi.me();
      if (response.user.role !== "admin") {
        clearSession();
        return;
      }
      setUser(response.user);
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function login(payload: { email: string; password: string }) {
    const response = await adminApi.login(payload);
    if (response.user.role !== "admin") {
      throw new Error("This account does not have admin access.");
    }

    localStorage.setItem(ADMIN_TOKEN_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  }

  function logout() {
    clearSession();
  }

  const value = {
    token,
    user,
    loading,
    login,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AuthProvider");
  }

  return context;
}
