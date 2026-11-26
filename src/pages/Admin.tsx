import { useEffect, useState } from "react";
import {
  fetchRegistrations,
  type AdminRegistration,
} from "../api/admin";
import { ApiError } from "../api/registrations";
import SiteNav from "../components/SiteNav";
import "./Register.css";
import "./Admin.css";

export default function Admin() {
  const [rows, setRows] = useState<AdminRegistration[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchRegistrations(controller.signal)
      .then(setRows)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof ApiError ? err.message : "Could not load registrations.",
        );
      });
    return () => controller.abort();
  }, []);

  return (
    <>
      <SiteNav />

      <header className="hero">
        <div className="hero-inner">
          <div className="hero-drop" />
          <div className="hero-eyebrow">
            <span className="dot" />
            నిర్వాహకులు
            <span className="dot" />
          </div>
          <h1>Admin</h1>
          <p className="tag">Registrations received on the site.</p>
        </div>
      </header>

      <main>
        <div className="register-card admin-card">
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          {!error && !rows && <p>Loading…</p>}
          {rows && rows.length === 0 && <p>No registrations yet.</p>}
          {rows && rows.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.fullName}</td>
                      <td>{r.phone}</td>
                      <td>{r.email || "—"}</td>
                      <td>{r.city || "—"}</td>
                      <td>{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer>
        <div className="hexline" />© Honey Product
      </footer>
    </>
  );
}
