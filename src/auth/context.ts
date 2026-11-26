import { createContext } from "react";
import type { AuthUser, Session } from "../lib/session";

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  login: (session: Session) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);
