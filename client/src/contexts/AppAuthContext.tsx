import { createContext, useContext, useState, ReactNode } from "react";

const SESSION_KEY = "qa_session";
const PASSWORD = "galveston";

export type ReviewerRole = "builder" | "qa1" | "qa2" | "md" | "ed";

export interface AppSession {
  name: string;
  role: ReviewerRole;
  email: string;
  authenticated: boolean;
}

interface AppAuthContextValue {
  session: AppSession | null;
  login: (password: string, name: string, role: ReviewerRole, email: string) => boolean;
  logout: () => void;
  updateSession: (name: string, role: ReviewerRole, email: string) => void;
}

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppSession;
        if (parsed.authenticated && parsed.name) return parsed;
      }
    } catch {}
    return null;
  });

  const login = (password: string, name: string, role: ReviewerRole, email: string): boolean => {
    if (password.trim().toLowerCase() !== PASSWORD) return false;
    const newSession: AppSession = { name: name.trim(), role, email: email.trim(), authenticated: true };
    setSession(newSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    return true;
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const updateSession = (name: string, role: ReviewerRole, email: string) => {
    const updated: AppSession = { name, role, email, authenticated: true };
    setSession(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  };

  return (
    <AppAuthContext.Provider value={{ session, login, logout, updateSession }}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AppAuthContext);
  if (!ctx) throw new Error("useAppAuth must be used within AppAuthProvider");
  return ctx;
}
