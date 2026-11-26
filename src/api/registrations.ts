export type RegistrationInput = {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  password: string;
  consent: boolean;
};

export type RegistrationResult = {
  id: string;
  createdAt: string;
};

/** Thrown when the API returns 4xx/5xx. fieldErrors = the "errors" map from ApiExceptionHandler. */
export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function createRegistration(
  input: RegistrationInput,
): Promise<RegistrationResult> {
  let res: Response;
  try {
    res = await fetch("/api/v1/registrations", {
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
