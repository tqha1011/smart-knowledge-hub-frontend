// src/components/usersComponent/UserDetailPanel.tsx
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { usePanelDismiss } from "../common/usePanelDismiss";
import { knowledgeSpaceMemberService } from "../../services/spaceService";
import { toErrorMessage } from "../../shared/handleApiError";
import { initialsFromName } from "../../shared/textFormat";
import type { SpaceRole, UserDataSpaceDto } from "../../types";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";

const ALL_ROLES: SpaceRole[] = ["Owner", "Editor", "Viewer"];

interface UserDetailPanelProps {
  member: UserDataSpaceDto | null;
  isOpen: boolean;
  spacePublicId: string;
  canManage: boolean;
  onClose: () => void;
  /** Called after a successful role change so the parent can refetch the list. */
  onRoleChanged: () => void;
  /** Called after a successful removal so the parent can refetch the list. */
  onRemoved: () => void;
}

// Floating slide-over panel (420px, right-aligned), same pattern as
// DocumentDetailPanel — dims/blurs the page behind it, closes back to
// exactly where the user was.
export function UserDetailPanel({
  member,
  isOpen,
  spacePublicId,
  canManage,
  onClose,
  onRoleChanged,
  onRemoved,
}: UserDetailPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && member && (
        <UserDetailPanelBody
          member={member}
          spacePublicId={spacePublicId}
          canManage={canManage}
          onClose={onClose}
          onRoleChanged={onRoleChanged}
          onRemoved={onRemoved}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

interface UserDetailPanelBodyProps {
  member: UserDataSpaceDto;
  spacePublicId: string;
  canManage: boolean;
  onClose: () => void;
  onRoleChanged: () => void;
  onRemoved: () => void;
  prefersReducedMotion: boolean | null;
}

// Split out from UserDetailPanel so this only mounts while `isOpen` is
// true — local state re-initializes fresh from `member` on each open,
// same as DocumentFormPanelBody.
function UserDetailPanelBody({
  member,
  spacePublicId,
  canManage,
  onClose,
  onRoleChanged,
  onRemoved,
  prefersReducedMotion,
}: UserDetailPanelBodyProps) {
  const panelRef = usePanelDismiss(true, onClose);
  const [newRole, setNewRole] = useState<SpaceRole | "">("");
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Only offer roles other than the member's current one — picking one is
  // the "change to" action, not a redundant no-op re-selection.
  const otherRoles = ALL_ROLES.filter((role) => role !== member.role);

  const handleSaveRole = async () => {
    if (!newRole) return;
    setIsSavingRole(true);
    try {
      await knowledgeSpaceMemberService.updateRole(
        spacePublicId,
        member.publicId,
        {
          role: newRole,
        },
      );
      toast.success("Role updated.");
      onRoleChanged();
    } catch (error) {
      toast.error(toErrorMessage(error as ApiErrorResponse));
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await knowledgeSpaceMemberService.kickMembers(spacePublicId, {
        userPublicIds: [member.publicId],
      });
      toast.success("Member removed.");
      onRemoved();
    } catch (error) {
      toast.error(toErrorMessage(error as ApiErrorResponse));
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close member details"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        className="bg-ink/40 absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${member.name} details`}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.22,
          ease: "easeOut",
        }}
        className="bg-surface absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col overflow-y-auto p-5 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-avatar-bg text-avatar-fg flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {initialsFromName(member.name)}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-ink truncate text-lg font-semibold">
                {member.name}
              </h2>
              <p className="text-ink-muted truncate text-xs">{member.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close member details"
            className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-border rounded-lg border p-3">
          <p className="text-ink-muted text-xs">Current role</p>
          <p className="text-ink mt-0.5 text-sm font-semibold">{member.role}</p>
        </div>

        {canManage && (
          <div className="mt-4">
            <label
              htmlFor="member-new-role"
              className="text-ink-muted text-xs font-medium"
            >
              Change role to
            </label>
            <div className="mt-1 flex gap-2">
              <select
                id="member-new-role"
                value={newRole}
                onChange={(event) =>
                  setNewRole(event.target.value as SpaceRole)
                }
                className="border-border text-ink focus:border-accent flex-1 rounded-md border px-3 py-2 text-sm outline-none"
              >
                <option value="" disabled>
                  Select a role…
                </option>
                {otherRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={!newRole || isSavingRole}
                className="bg-accent rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSavingRole ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        {canManage && (
          <div className="mt-auto pt-6">
            {isConfirmingRemove ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingRemove(false)}
                  className="border-border text-ink hover:bg-surface-sunken flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="bg-warn-bg text-warn-fg flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  {isRemoving ? "Removing…" : "Confirm remove"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingRemove(true)}
                className="bg-warn-bg text-warn-fg flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
              >
                <Trash2 size={14} />
                Remove from space
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
