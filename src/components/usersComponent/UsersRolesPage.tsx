import { useState } from "react";
import { Plus } from "lucide-react";
import { UsersTable } from "./UsersTable";
import { UserDetailPanel } from "./UserDetailPanel";
import { InvitePeoplePanel } from "./InvitePeoplePanel";
import type {
  InviteCandidate,
  OrgUser,
  Space,
  UserAccessUpdate,
} from "../../types";

interface UsersRolesPageProps {
  users: OrgUser[];
  allSpaces: Space[];
  onUpdateUserAccess: (userId: string, update: UserAccessUpdate) => void;
  onRemoveUser: (userId: string) => void;
  onInvitePeople: (candidates: InviteCandidate[]) => void;
}

// Admin-only org-wide list page + two slide-over panels, same page shape
// as DocumentLibrary: this component owns only local UI state (which row
// is selected, which panel is open) — the `users` array itself is lifted
// to PortalShell (see PortalShell.tsx), not owned here, for the same
// reason `documents` is: this page unmounts whenever the Admin navigates
// to a sibling nav item, so an edit/remove made here must not be silently
// undone on the next unmount/remount round-trip.
export function UsersRolesPage({
  users,
  allSpaces,
  onUpdateUserAccess,
  onRemoveUser,
  onInvitePeople,
}: UsersRolesPageProps) {
  const [selectedUser, setSelectedUser] = useState<OrgUser | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(false);

  const handleOpenUser = (user: OrgUser) => {
    setSelectedUser(user);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailPanelOpen(false);
  };

  const handleSaveAccess = (userId: string, update: UserAccessUpdate) => {
    onUpdateUserAccess(userId, update);
    setIsDetailPanelOpen(false);
  };

  const handleRemove = (userId: string) => {
    onRemoveUser(userId);
    setIsDetailPanelOpen(false);
  };

  const handleInvite = (candidates: InviteCandidate[]) => {
    onInvitePeople(candidates);
    setIsInvitePanelOpen(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold">
            Users & Roles
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            {users.length} {users.length === 1 ? "person" : "people"} across the
            organization
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsInvitePanelOpen(true)}
          className="bg-accent flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          Invite people
        </button>
      </div>

      <UsersTable users={users} onOpenUser={handleOpenUser} />

      <UserDetailPanel
        user={selectedUser}
        isOpen={isDetailPanelOpen}
        allSpaces={allSpaces}
        onClose={handleCloseDetail}
        onSave={handleSaveAccess}
        onRemove={handleRemove}
      />

      <InvitePeoplePanel
        isOpen={isInvitePanelOpen}
        allSpaces={allSpaces}
        onClose={() => setIsInvitePanelOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}
