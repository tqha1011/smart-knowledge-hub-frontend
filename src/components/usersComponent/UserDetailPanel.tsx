// src/components/usersComponent/UserDetailPanel.tsx
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, Trash2, X } from "lucide-react";
import { usePanelDismiss } from "../common/usePanelDismiss";
import type { OrgUser, Space, SpaceRole, UserAccessUpdate } from "../../types";

interface UserDetailPanelProps {
  user: OrgUser | null;
  isOpen: boolean;
  allSpaces: Space[];
  onClose: () => void;
  onSave: (userId: string, update: UserAccessUpdate) => void;
  onRemove: (userId: string) => void;
}

// Floating slide-over panel (420px, right-aligned), same pattern as
// DocumentDetailPanel — dims/blurs the page behind it, closes back to
// exactly where the user was.
export function UserDetailPanel({
  user,
  isOpen,
  allSpaces,
  onClose,
  onSave,
  onRemove,
}: UserDetailPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && user && (
        <UserDetailPanelBody
          user={user}
          allSpaces={allSpaces}
          onClose={onClose}
          onSave={onSave}
          onRemove={onRemove}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}

interface UserDetailPanelBodyProps {
  user: OrgUser;
  allSpaces: Space[];
  onClose: () => void;
  onSave: (userId: string, update: UserAccessUpdate) => void;
  onRemove: (userId: string) => void;
  prefersReducedMotion: boolean | null;
}

interface MembershipDraft {
  key: string;
  spaceId: string;
  role: SpaceRole;
}

// Split out from UserDetailPanel so this only mounts while `isOpen` is
// true — every field's local state re-initializes fresh from `user` on
// each open, same as DocumentFormPanelBody.
function UserDetailPanelBody({
  user,
  allSpaces,
  onClose,
  onSave,
  onRemove,
  prefersReducedMotion,
}: UserDetailPanelBodyProps) {
  const panelRef = usePanelDismiss(true, onClose);
  const [isAdminEdit, setIsAdminEdit] = useState(user.isAdmin);
  const [memberships, setMemberships] = useState<MembershipDraft[]>(() =>
    user.memberships.map((m) => ({
      key: m.space.id,
      spaceId: m.space.id,
      role: m.role,
    })),
  );
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);

  const usedSpaceIds = new Set(memberships.map((m) => m.spaceId));
  const unassignedSpaces = allSpaces.filter((s) => !usedSpaceIds.has(s.id));

  const handleAddSpace = () => {
    const nextSpace = unassignedSpaces[0];
    if (!nextSpace) return;
    setMemberships((prev) => [
      ...prev,
      {
        key: `${nextSpace.id}-${Date.now()}`,
        spaceId: nextSpace.id,
        role: "Employee",
      },
    ]);
  };

  const handleRemoveMembership = (key: string) => {
    setMemberships((prev) => prev.filter((m) => m.key !== key));
  };

  const handleMembershipSpaceChange = (key: string, spaceId: string) => {
    setMemberships((prev) =>
      prev.map((m) => (m.key === key ? { ...m, spaceId } : m)),
    );
  };

  const handleMembershipRoleChange = (key: string, role: SpaceRole) => {
    setMemberships((prev) =>
      prev.map((m) => (m.key === key ? { ...m, role } : m)),
    );
  };

  // Spaces available to a given row's own select: every space not already
  // used by ANOTHER row, plus this row's own current space (so its current
  // selection stays visible in its own dropdown) — prevents two rows from
  // ever pointing at the same Space.
  const availableSpacesForRow = (rowKey: string) =>
    allSpaces.filter((s) => {
      const usedByOtherRow = memberships.some(
        (m) => m.key !== rowKey && m.spaceId === s.id,
      );
      return !usedByOtherRow;
    });

  const handleSave = () => {
    const resolvedMemberships = memberships
      .map((draft) => {
        const space = allSpaces.find((s) => s.id === draft.spaceId);
        return space ? { space, role: draft.role } : null;
      })
      .filter((m): m is { space: Space; role: SpaceRole } => m !== null);

    onSave(user.id, { isAdmin: isAdminEdit, memberships: resolvedMemberships });
  };

  return (
    <div className="fixed inset-0 z-40">
      <motion.button
        type="button"
        aria-label="Close user details"
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
        aria-label={`${user.name} details`}
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
              {user.avatarInitials}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-ink truncate text-lg font-semibold">
                {user.name}
              </h2>
              <p className="text-ink-muted truncate text-xs">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close user details"
            className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-border flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-ink text-sm font-semibold">
              System-wide Admin access
            </p>
            <p className="text-ink-muted text-xs">
              Everything an Editor can do, in every Space.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isAdminEdit}
            aria-label="System-wide Admin access"
            onClick={() => setIsAdminEdit((prev) => !prev)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              isAdminEdit ? "bg-accent" : "bg-surface-sunken"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform ${
                isAdminEdit ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-ink text-sm font-semibold">
              Space memberships
            </h3>
            {unassignedSpaces.length > 0 && (
              <button
                type="button"
                onClick={handleAddSpace}
                className="text-accent flex items-center gap-1 text-xs font-semibold"
              >
                <Plus size={12} />
                Add space
              </button>
            )}
          </div>
          {memberships.length === 0 ? (
            <div className="border-border text-ink-muted flex min-h-16 items-center justify-center rounded-lg border border-dashed text-center text-sm">
              No Space memberships.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {memberships.map((membership, index) => (
                <div key={membership.key} className="flex items-center gap-2">
                  <select
                    aria-label={`Space for membership ${index + 1}`}
                    value={membership.spaceId}
                    onChange={(event) =>
                      handleMembershipSpaceChange(
                        membership.key,
                        event.target.value,
                      )
                    }
                    className="border-border text-ink focus:border-accent flex-1 rounded-md border px-2 py-1.5 text-sm outline-none"
                  >
                    {availableSpacesForRow(membership.key).map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={`Role for membership ${index + 1}`}
                    value={membership.role}
                    onChange={(event) =>
                      handleMembershipRoleChange(
                        membership.key,
                        event.target.value as SpaceRole,
                      )
                    }
                    className="border-border text-ink focus:border-accent rounded-md border px-2 py-1.5 text-sm outline-none"
                  >
                    <option value="Editor">Editor</option>
                    <option value="Employee">Employee</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveMembership(membership.key)}
                    aria-label={`Remove membership ${index + 1}`}
                    className="text-ink-muted hover:bg-surface-sunken flex size-8 shrink-0 items-center justify-center rounded-md"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-6">
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
                onClick={() => onRemove(user.id)}
                className="bg-warn-bg text-warn-fg flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
              >
                <Trash2 size={14} />
                Confirm remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingRemove(true)}
              className="bg-warn-bg text-warn-fg flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
            >
              <Trash2 size={14} />
              Remove user
            </button>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-ink hover:bg-surface-sunken rounded-md px-3 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-accent rounded-md px-4 py-2 text-sm font-semibold text-white"
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
