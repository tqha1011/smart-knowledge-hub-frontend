import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, TriangleAlert } from "lucide-react";
import { toast } from "react-toastify";
import { AuthCard } from "../components/authComponent/AuthCard";
import { CustomInput } from "../components/authComponent/CustomInput";
import { PageTransition } from "../components/common/PageTransition";
import { authService } from "../services/authService";
import { setSession } from "../shared/authSession";

// `/login` — returning users only. No self-registration: accounts are
// provisioned by an Admin (see `/set-password` for invite acceptance).
export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Enter both your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { accessToken, refreshToken } = await authService.login({
        email,
        password,
        rememberMe: keepSignedIn,
      });
      setSession(accessToken, refreshToken);
      toast.success("Signed in successfully.");
      navigate("/spaces", { replace: true });
    } catch {
      setFormError("Incorrect email or password. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <AuthCard
        title="Knowledge Portal"
        subtitle="Sign in to your workspace"
        footer={
          <p>
            No access yet?{" "}
            <span className="text-ink">Contact your workspace admin.</span>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="bg-warn-bg text-warn-fg flex items-start gap-2 rounded-md px-3 py-2 text-sm">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <CustomInput
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            icon={<Mail size={16} />}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
          />
          <CustomInput
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            icon={<Lock size={16} />}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />

          <div className="flex items-center justify-between text-sm">
            <label className="text-ink-muted flex items-center gap-2">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(event) => setKeepSignedIn(event.target.checked)}
                className="accent-accent size-4 rounded"
              />
              Keep me signed in for 30 days
            </label>
            <Link
              to="/forgot-password"
              className="text-accent text-sm font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-accent mt-1 rounded-md py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </AuthCard>
    </PageTransition>
  );
}
