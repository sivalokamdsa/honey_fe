import { ApiError } from "./registrations";
import { authHeaders, notifyIfUnauthorized } from "./client";

export type AdminRegistration = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  createdAt: string;
};

/** GET /api/v1/admin/registrations. Requires an admin token. */
export async function fetchRegistrations(
  signal?: AbortSignal,
): Promise<AdminRegistration[]> {
  let res: Response;
  try {
    res = await fetch("/api/v1/admin/registrations", {
      headers: authHeaders(),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(
      "Cannot reach the server. Check your internet and try again.",
      0,
    );
  }

  if (!res.ok) {
    notifyIfUnauthorized(res);
    const problem = await res.json().catch(() => ({}));
    throw new ApiError(
      problem.detail ?? "Could not load registrations.",
      res.status,
    );
  }
  return res.json();
}
