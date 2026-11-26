import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "../lib/session";
import { useAuth } from "./useAuth";

type Props = {
  /** If set, the user must have this role. Otherwise any logged-in user passes. */
  role?: Role;
  children: ReactNode;
};

/**
 * Route guard. Logged-out visitors go to /login and come back to the page
 * afterwards. Logged-in users without the required role go to the home page.
 */
export default function RequireAuth({ role, children }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
