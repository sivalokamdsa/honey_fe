export type Role = "user" | "admin";

export type AuthUser = {
  id: string;
  fullName: string;
  phone: string;
  role: Role;
};

export type Session = {
  token: string;
  user: AuthUser;
};

const SESSION_KEY = "honey-session";

/** Returns the stored session, or null if none or unreadable. */
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session> | null;
    if (
      !parsed ||
      typeof parsed.token !== "string" ||
      !parsed.user ||
      typeof parsed.user.id !== "string"
    ) {
      return null;
    }
    return {
      token: parsed.token,
      user: {
        ...parsed.user,
        // Anything other than "admin" is treated as a regular user.
        role: parsed.user.role === "admin" ? "admin" : "user",
      },
    };
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked (private mode, quota). The user stays logged out on reload.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
