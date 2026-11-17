import { useState, type FormEvent, type ReactNode } from "react";
import {
  ApiError,
  createRegistration,
  type RegistrationInput,
} from "../api/registrations";
import SiteNav from "../components/SiteNav";
import "./Register.css";

type FieldErrors = Partial<Record<keyof RegistrationInput, string>>;

const emptyForm: RegistrationInput = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  consent: false,
};

export default function Register() {
  const [form, setForm] = useState<RegistrationInput>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update<K extends keyof RegistrationInput>(
    key: K,
    value: RegistrationInput[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);
    try {
      await createRegistration(form);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        setErrors(err.fieldErrors as FieldErrors);
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
            Honey Course
            <span className="dot" />
          </div>
          <h1>నమోదు చేసుకోండి</h1>
          <p className="tag">
            Register for the honey course. We will contact you with details.
          </p>
        </div>
      </header>

      <main>
        <div className="register-card">
          {done ? (
            <div className="success">
              <h2>ధన్యవాదాలు! Thank you</h2>
              <p>
                Your registration is saved. We will contact you on your phone
                number.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <p className="register-why">
                We use these details only to contact you about the honey course.
              </p>

              <Field label="Full name *" error={errors.fullName}>
                <input
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                />
              </Field>

              <Field label="Mobile number *" error={errors.phone}>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </Field>

              <div className="field-row">
                <Field label="Email" error={errors.email}>
                  <input
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </Field>
                <Field label="City" error={errors.city}>
                  <input
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                  />
                </Field>
              </div>

              <div className="field">
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => update("consent", e.target.checked)}
                  />
                  <span>
                    I agree that my details are stored to contact me about the
                    course.
                  </span>
                </label>
                {errors.consent && (
                  <p className="field-error">{errors.consent}</p>
                )}
              </div>

              {generalError && (
                <div className="form-error" role="alert">
                  {generalError}
                </div>
              )}

              <button type="submit" className="btn-honey" disabled={submitting}>
                {submitting ? "Saving…" : "Register"}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer>
        <div className="hexline" />© Honey Course
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
