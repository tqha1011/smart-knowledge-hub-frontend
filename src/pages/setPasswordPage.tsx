import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { toast } from "react-toastify";
import { AuthCard } from "../components/authComponent/AuthCard";
import { CustomInput } from "../components/authComponent/CustomInput";
import { PageTransition } from "../components/common/PageTransition";
import { resolveInvite, setPassword } from "../services/authService";
import type { InviteContextDto } from "../types";

// `/set-password?token=...` — invite acceptance / first-time password
// setup, reached via a link an Admin sends after provisioning an account.
export function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [invite, setInvite] = useState<InviteContextDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // MOCK: resolves who's being invited, to which Space, and with what
    // role from the token — stands in for `GET /invites/:token`.
    resolveInvite(token)
      .then(setInvite)
      .catch((error: Error) => setLoadError(error.message));
  }, [token]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (password.length < 8 || !/\d/.test(password)) {
      setFormError(
        "Password must be at least 8 characters and include a number.",
      );
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await setPassword({ password });
      toast.success("Password set. You can now sign in.");
      navigate("/login", { replace: true });
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <PageTransition>
        <AuthCard title="Invite link invalid" subtitle={loadError} />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <AuthCard
        title="Set your password"
        subtitle="Finish setting up your account"
      >
        {invite && (
          // Invite-context banner — the one thing that makes this screen
          // legible as "someone set this up for you," not a generic signup.
          <div className="bg-accent-soft text-accent mb-4 rounded-md px-3 py-2 text-sm">
            Joining <strong>{invite.spaceName}</strong> space as{" "}
            <strong>{invite.role}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="bg-warn-bg text-warn-fg rounded-md px-3 py-2 text-sm">
              {formError}
            </div>
          )}

          <CustomInput
            id="invite-email"
            label="Email"
            type="email"
            icon={<Mail size={16} />}
            value={invite?.email ?? ""}
            disabled
          />
          <div className="flex flex-col gap-1">
            <CustomInput
              id="new-password"
              label="New password"
              type="password"
              autoComplete="new-password"
              icon={<Lock size={16} />}
              value={password}
              onChange={(event) => setPasswordValue(event.target.value)}
              placeholder="••••••••"
            />
            <p className="text-ink-muted text-xs">
              At least 8 characters, one number
            </p>
          </div>
          <CustomInput
            id="confirm-password"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            icon={<Lock size={16} />}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={isSubmitting || !invite}
            className="bg-accent mt-1 rounded-md py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Setting password..." : "Set password & continue"}
          </button>
        </form>
      </AuthCard>
    </PageTransition>
  );
}
