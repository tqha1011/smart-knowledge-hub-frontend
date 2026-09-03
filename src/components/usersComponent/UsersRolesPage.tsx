import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { UsersTable } from "./UsersTable";
import { UserDetailPanel } from "./UserDetailPanel";
import { AddMemberPanel } from "./AddMemberPanel";
import { knowledgeSpaceService } from "../../services/spaceService";
import { toErrorMessage } from "../../shared/handleApiError";
import type { Space, UserDataSpaceDto } from "../../types";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";

interface UsersRolesPageProps {
  space: Space;
  /** isAdmin || Editor-in-this-Space — gates Add member, row actions. */
  canManage: boolean;
}

// Space-scoped member list + two slide-over panels, same page shape as
// DocumentLibrary: this component owns its own fetched `members` list and
// only local UI state (which row is selected, which panel is open).
export function UsersRolesPage({ space, canManage }: UsersRolesPageProps) {
  const spacePublicId = space.id;

  const [members, setMembers] = useState<UserDataSpaceDto[]>([]);
  const [selectedMember, setSelectedMember] = useState<UserDataSpaceDto | null>(
    null,
  );
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      const response = await knowledgeSpaceService.getListUser(spacePublicId);
      setMembers(response.items);
    } catch (error) {
      toast.error(toErrorMessage(error as ApiErrorResponse));
    }
  }, [spacePublicId]);

  useEffect(() => {
    let isActive = true;
    knowledgeSpaceService
      .getListUser(spacePublicId)
      .then((response) => {
        if (isActive) setMembers(response.items);
      })
      .catch((error: ApiErrorResponse) => {
        if (isActive) toast.error(toErrorMessage(error));
      });
    return () => {
      isActive = false;
    };
  }, [spacePublicId]);

  const handleOpenMember = (member: UserDataSpaceDto) => {
    setSelectedMember(member);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailPanelOpen(false);
  };

  const handleRoleChanged = () => {
    setIsDetailPanelOpen(false);
    loadMembers();
  };

  const handleRemoved = () => {
    setIsDetailPanelOpen(false);
    loadMembers();
  };

  const handleAdded = () => {
    setIsAddPanelOpen(false);
    loadMembers();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold">
            Members
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            {members.length} {members.length === 1 ? "person" : "people"} in{" "}
            {space.name}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setIsAddPanelOpen(true)}
            className="bg-accent flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            Add member
          </button>
        )}
      </div>

      <UsersTable
        members={members}
        onOpenMember={handleOpenMember}
        canManage={canManage}
      />

      <UserDetailPanel
        member={selectedMember}
        isOpen={isDetailPanelOpen}
        spacePublicId={spacePublicId}
        canManage={canManage}
        onClose={handleCloseDetail}
        onRoleChanged={handleRoleChanged}
        onRemoved={handleRemoved}
      />

      <AddMemberPanel
        isOpen={isAddPanelOpen}
        spacePublicId={spacePublicId}
        onClose={() => setIsAddPanelOpen(false)}
        onAdded={handleAdded}
      />
    </div>
  );
}
