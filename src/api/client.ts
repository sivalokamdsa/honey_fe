import { loadSession } from "../lib/session";

/** Fired on window when the server rejects the stored token with 401. */
export const UNAUTHORIZED_EVENT = "auth:unauthorized";

/** Authorization header for the current session, or nothing when logged out. */
export function authHeaders(): Record<string, string> {
  const session = loadSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

/** Logs the user out in the app when a stored token is no longer accepted. */
export function notifyIfUnauthorized(res: Response): void {
  if (res.status === 401 && loadSession()) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
}
