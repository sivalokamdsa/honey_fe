import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { ApiError } from "../api/registrations";
import { useAuth } from "../auth/useAuth";
import SiteNav from "../components/SiteNav";
import "./Register.css";

/** Only allow in-app redirects, never off-site URLs. */
function safeReturnPath(from: unknown): string {
  return typeof from === "string" && from.startsWith("/") && !from.startsWith("//")
    ? from
    : "/";
}

export default function Login() {
  const { user, login: storeSession, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = safeReturnPath(
    (location.state as { from?: unknown } | null)?.from,
  );

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);
    try {
      const session = await login({ phone, password });
      storeSession(session);
      navigate(returnTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        setErrors(err.fieldErrors);
      } else if (err instanceof ApiError) {
        setGeneralError(err.message);
      } else {
        setGeneralError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteNav />

      <header className="hero">
        <div className="hero-inner">
          <div className="hero-drop" />
          <div className="hero-eyebrow">
            <span className="dot" />
            ప్రకృతి ఆరోగ్య గ్రంథం
            <span className="dot" />
          </div>
          <h1>లాగిన్</h1>
          <p className="tag">Login with your phone number and password.</p>
        </div>
      </header>

      <main>
        <div className="register-card">
          {user ? (
            <div className="success">
              <h2>స్వాగతం! Welcome, {user.fullName}</h2>
              <p>
                You are logged in as {user.phone}
                {user.role === "admin" ? " (admin)" : ""}.
              </p>
              <button
                type="button"
                className="btn-honey"
                onClick={() => {
                  logout();
                  navigate("/", { replace: true });
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <Field label="Mobile number *" error={errors.phone}>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="username"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrors((x) => ({ ...x, phone: "" }));
                  }}
                />
              </Field>

              <Field label="Password *" error={errors.password}>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((x) => ({ ...x, password: "" }));
                  }}
                />
              </Field>

              {generalError && (
                <div className="form-error" role="alert">
                  {generalError}
                </div>
              )}

              <button type="submit" className="btn-honey" disabled={submitting}>
                {submitting ? "Logging in…" : "Login"}
              </button>

              <p className="register-why">
                New here? <Link to="/register">Register</Link>
              </p>
            </form>
          )}
        </div>
      </main>

      <footer>
        <div className="hexline" />© Honey Product
      </footer>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label>
        {label}
        {children}
      </label>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
