import { MoreHorizontal } from "lucide-react";
import type { UserDataSpaceDto } from "../../types";
import { formatRelativeDate, initialsFromName } from "../../shared/textFormat";

interface UsersTableProps {
  members: UserDataSpaceDto[];
  onOpenMember: (member: UserDataSpaceDto) => void;
  /** isAdmin || Editor-in-this-Space — gates the row (⋯) action menu. */
  canManage: boolean;
}

// Space-scoped member list — same list/table shape as DocumentTable: a
// name/avatar button and a trailing ⋯ button both open the same row's
// detail panel.
export function UsersTable({
  members,
  onOpenMember,
  canManage,
}: UsersTableProps) {
  if (members.length === 0) {
    return (
      <div className="border-border text-ink-muted flex min-h-48 items-center justify-center rounded-lg border border-dashed text-center text-sm">
        No members in this space yet.
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
              Role
            </th>
            <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
              Joined
            </th>
            <th className="px-2 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {members.map((member) => (
            <tr key={member.publicId} className="hover:bg-surface-sunken">
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onOpenMember(member)}
                  className="flex min-w-0 items-center gap-2 text-left"
                >
                  <span className="bg-avatar-bg text-avatar-fg flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                    {initialsFromName(member.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="text-ink block truncate font-medium">
                      {member.name}
                    </span>
                    <span className="text-ink-muted block truncate text-xs">
                      {member.email}
                    </span>
                  </span>
                </button>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <span className="bg-surface-sunken text-ink-muted rounded-full px-2 py-0.5 text-xs font-medium">
                  {member.role}
                </span>
              </td>
              <td className="text-ink-muted hidden px-4 py-3 lg:table-cell">
                {formatRelativeDate(member.joinedAt)}
              </td>
              <td className="px-2 py-3">
                {canManage && (
                  <button
                    type="button"
                    onClick={() => onOpenMember(member)}
                    aria-label={`Actions for ${member.name}`}
                    className="text-ink-muted hover:bg-surface flex size-8 items-center justify-center rounded-md"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
