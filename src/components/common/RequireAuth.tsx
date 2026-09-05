import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken } from "../../shared/authSession";

interface RequireAuthProps {
  children: ReactNode;
}

// Gates on the presence of an access token rather than a real session
// check (no expiry/validity check) — a stale-but-present token is caught
// downstream by api.ts's response interceptor, which refreshes or clears
// the session and redirects on a 401.
export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const hasSession = Boolean(getAccessToken());

  if (!hasSession) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
