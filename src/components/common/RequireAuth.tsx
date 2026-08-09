import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface RequireAuthProps {
  children: ReactNode;
}

// MOCK: gates on the presence of `accessToken` in localStorage rather than a
// real session check — enough to demonstrate the login -> spaces flow
// without a backend. Swap for real session validation once auth is wired up.
export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const hasSession = Boolean(localStorage.getItem("accessToken"));

  if (!hasSession) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
