import { MoreHorizontal } from "lucide-react";
import type { OrgUser, UserStatus } from "../../types";

interface UsersTableProps {
  users: OrgUser[];
  onOpenUser: (user: OrgUser) => void;
}

// Reuses the same status-token pairs the Document Library's processing
// badge does (Active = --status-ready-*, "done/good"; Invited =
// --status-processing-*, "in progress, not final yet") — the same
// semantic reuse the spec's Design Tokens section describes.
const STATUS_BADGE: Record<UserStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-status-ready-bg text-status-ready-fg",
  },
  invited: {
    label: "Invited",
    className: "bg-status-processing-bg text-status-processing-fg",
  },
};

// Org-wide people list (not Space-scoped), per spec. Same list/table shape
// as DocumentTable: a name/avatar button and a trailing ⋯ button both open
// the same row's detail panel — there's only one row action in this pass,
// so both controls are equivalent entry points to it.
export function UsersTable({ users, onOpenUser }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="border-border text-ink-muted flex min-h-48 items-center justify-center rounded-lg border border-dashed text-center text-sm">
        No one has been invited yet.
      </div>
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-sunken text-ink-muted text-xs">
          <tr>
            <th className="px-4 py-2.5 font-medium">Person</th>
            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
              Admin
            </th>
            <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
              Spaces
            </th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-2 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-surface-sunken">
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onOpenUser(user)}
                  className="flex min-w-0 items-center gap-2 text-left"
                >
                  <span className="bg-avatar-bg text-avatar-fg flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                    {user.avatarInitials}
                  </span>
                  <span className="min-w-0">
                    <span className="text-ink block truncate font-medium">
                      {user.name}
                    </span>
                    <span className="text-ink-muted block truncate text-xs">
                      {user.email}
                    </span>
                  </span>
                </button>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                {user.isAdmin && (
                  <span className="bg-accent-soft text-accent rounded-full px-2 py-0.5 text-xs font-medium">
                    Admin
                  </span>
                )}
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {user.memberships.map((membership) => (
                    <span
                      key={membership.space.id}
                      className="bg-surface-sunken text-ink-muted rounded-full px-2 py-0.5 text-xs font-medium"
                    >
                      {membership.space.name} · {membership.role}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[user.status].className}`}
                >
                  {STATUS_BADGE[user.status].label}
                </span>
              </td>
              <td className="px-2 py-3">
                <button
                  type="button"
                  onClick={() => onOpenUser(user)}
                  aria-label={`Actions for ${user.name}`}
                  className="text-ink-muted hover:bg-surface flex size-8 items-center justify-center rounded-md"
                >
                  <MoreHorizontal size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
