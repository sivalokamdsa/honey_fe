import { ApiError } from "./registrations";
import type { Session } from "../lib/session";

export type LoginInput = {
  phone: string;
  password: string;
};

/**
 * POST /api/v1/auth/login. Expects `{ token, user: { id, fullName, phone, role } }`.
 * The caller stores the session (see AuthProvider). 401 (detail:
 * "Invalid phone or password") is thrown as ApiError.
 */
export async function login(input: LoginInput): Promise<Session> {
  let res: Response;
  try {
    res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Check your internet and try again.",
      0,
    );
  }

  if (res.ok) return res.json();

  const problem = await res.json().catch(() => ({}));
  throw new ApiError(
    problem.detail ?? "Something went wrong. Please try again.",
    res.status,
    problem.errors ?? {},
  );
}
