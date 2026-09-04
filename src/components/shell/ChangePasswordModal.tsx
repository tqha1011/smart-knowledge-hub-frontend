import { useState } from "react";
import type { FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, X } from "lucide-react";
import { toast } from "react-toastify";
import { usePanelDismiss } from "../common/usePanelDismiss";
import { CustomInput } from "../authComponent/CustomInput";
import { authService } from "../../services/authService";
import { toErrorMessage } from "../../shared/handleApiError";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";

interface ChangePasswordModalProps {
  onClose: () => void;
}

// Centered dialog opened from UserMenu — reuses usePanelDismiss for
// Escape/focus-trap even though it isn't a slide-over panel, since that
// hook's behavior isn't tied to any particular layout.
export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const dialogRef = usePanelDismiss(true, onClose);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!oldPassword) {
      setFormError("Enter your current password.");
      return;
    }
    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      setFormError(
        "New password must be at least 8 characters and include a number.",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.changePassword({ oldPassword, newPassword });
      toast.success("Password changed.");
      onClose();
    } catch (error) {
      setFormError(toErrorMessage(error as ApiErrorResponse));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <motion.button
        type="button"
        aria-label="Close change password dialog"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        className="bg-ink/40 absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Change password"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
          className="border-border bg-surface w-full max-w-sm rounded-lg border p-5 shadow-lg"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="font-display text-ink text-lg font-semibold">
              Change password
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close change password dialog"
              className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {formError && (
              <div className="bg-warn-bg text-warn-fg rounded-md px-3 py-2 text-sm">
                {formError}
              </div>
            )}

            <CustomInput
              id="old-password"
              label="Current password"
              type="password"
              autoComplete="current-password"
              icon={<Lock size={16} />}
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              placeholder="••••••••"
            />
            <div className="flex flex-col gap-1">
              <CustomInput
                id="change-new-password"
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
              id="change-confirm-password"
              label="Confirm new password"
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
              {isSubmitting ? "Changing..." : "Change password"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
