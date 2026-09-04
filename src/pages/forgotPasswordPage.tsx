import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Lock, TriangleAlert } from "lucide-react";
import { toast } from "react-toastify";
import { AuthCard } from "../components/authComponent/AuthCard";
import { CustomInput } from "../components/authComponent/CustomInput";
import { PageTransition } from "../components/common/PageTransition";
import { authService } from "../services/authService";
import { toErrorMessage } from "../shared/handleApiError";
import type { ApiErrorResponse } from "../types/commonType/apiResponse";

type Step = "email" | "otp" | "reset";

// `/forgot-password` — single route, three internal steps (send OTP, verify
// OTP, set new password), driven by local state rather than separate
// routes/query params since nothing here needs to be deep-linkable.
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendOtp = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError("Enter your email.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.sendOtp({ email });
      toast.success("OTP sent. Check your email.");
      setStep("otp");
    } catch (error) {
      setFormError(toErrorMessage(error as ApiErrorResponse));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!otp.trim()) {
      setFormError("Enter the OTP sent to your email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.verifyOtp({ email, otp });
      setResetToken(result.resetToken);
      setStep("reset");
    } catch (error) {
      setFormError(toErrorMessage(error as ApiErrorResponse));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      setFormError(
        "Password must be at least 8 characters and include a number.",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword({ email, resetToken, newPassword });
      toast.success("Password reset. You can now sign in.");
      navigate("/login", { replace: true });
    } catch (error) {
      setFormError(toErrorMessage(error as ApiErrorResponse));
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorBanner = formError && (
    <div className="bg-warn-bg text-warn-fg flex items-start gap-2 rounded-md px-3 py-2 text-sm">
      <TriangleAlert size={16} className="mt-0.5 shrink-0" />
      <span>{formError}</span>
    </div>
  );

  if (step === "email") {
    return (
      <PageTransition>
        <AuthCard
          title="Forgot password"
          subtitle="We'll email you an OTP to reset it"
          footer={
            <p>
              Remembered it?{" "}
              <Link to="/login" className="text-accent font-medium">
                Sign in
              </Link>
            </p>
          }
        >
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            {errorBanner}
            <CustomInput
              id="forgot-email"
              label="Email"
              type="email"
              autoComplete="email"
              icon={<Mail size={16} />}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent mt-1 rounded-md py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        </AuthCard>
      </PageTransition>
    );
  }

  if (step === "otp") {
    return (
      <PageTransition>
        <AuthCard
          title="Enter OTP"
          subtitle={`We sent a code to ${email}`}
          footer={
            <p>
              Didn&apos;t get it?{" "}
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-accent font-medium"
              >
                Use a different email
              </button>
            </p>
          }
        >
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            {errorBanner}
            <CustomInput
              id="forgot-otp"
              label="OTP code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              icon={<KeyRound size={16} />}
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="123456"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent mt-1 rounded-md py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        </AuthCard>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <AuthCard title="Reset password" subtitle="Choose a new password">
        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          {errorBanner}
          <div className="flex flex-col gap-1">
            <CustomInput
              id="forgot-new-password"
              label="New password"
              type="password"
              autoComplete="new-password"
              icon={<Lock size={16} />}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="••••••••"
            />
            <p className="text-ink-muted text-xs">
              At least 8 characters, one number
            </p>
          </div>
          <CustomInput
            id="forgot-confirm-password"
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
            disabled={isSubmitting}
            className="bg-accent mt-1 rounded-md py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </AuthCard>
    </PageTransition>
  );
}
