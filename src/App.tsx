import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LoginPage } from "./pages/loginPage";
import { ForgotPasswordPage } from "./pages/forgotPasswordPage";
import { SetPasswordPage } from "./pages/setPasswordPage";
import { SpacesOverviewPage } from "./pages/spacesOverviewPage";
import { PortalShell } from "./components/shell/PortalShell";
import { RequireAuth } from "./components/common/RequireAuth";
import { getAccessToken } from "./shared/authSession";
import { connectRealtime } from "./services/realtimeService";

// Gates the "/" redirect on the same access-token presence RequireAuth checks.
function RootRedirect() {
  const hasSession = Boolean(getAccessToken());
  return <Navigate to={hasSession ? "/spaces" : "/login"} replace />;
}

function AppRoutes() {
  const location = useLocation();

  // Mount-only: reconnects an existing session's socket after a page
  // refresh. Lives here, above <Routes>, so it isn't torn down and
  // reconnected on every navigation — <Routes> below is keyed on
  // location.pathname and remounts its subtree on each route change.
  useEffect(() => {
    connectRealtime();
  }, []);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route
          path="/spaces"
          element={
            <RequireAuth>
              <SpacesOverviewPage />
            </RequireAuth>
          }
        />
        <Route
          path="/spaces/:spaceId"
          element={
            <RequireAuth>
              <PortalShell />
            </RequireAuth>
          }
        />
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer position="top-right" theme="colored" />
    </BrowserRouter>
  );
}

export default App;
