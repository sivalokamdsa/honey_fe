import { ApiError } from "./registrations";

export type LoginInput = {
  phone: string;
  password: string;
};

export type LoginResult = {
  id: string;
  fullName: string;
  phone: string;
};

/**
 * POST /api/v1/auth/login. The backend issues no token or session, so a
 * successful call only confirms the credentials and returns the profile.
 * 401 (detail: "Invalid phone or password") is thrown as ApiError.
 */
export async function login(input: LoginInput): Promise<LoginResult> {
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
