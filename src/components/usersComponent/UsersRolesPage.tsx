import { useResource } from "../common/useResource";
import { ResourceState } from "../common/ResourceState";
import { Button } from "../common/Button";
import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { UsersTable } from "./UsersTable";
import { UserDetailPanel } from "./UserDetailPanel";
import { AddMemberPanel } from "./AddMemberPanel";
import { Pagination } from "../common/Pagination";
import { knowledgeSpaceService } from "../../services/spaceService";
import type { Space, UserDataSpaceDto } from "../../types";

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

  const [pageNumber, setPageNumber] = useState(1);
  const membersLoader = useCallback(
    () => knowledgeSpaceService.getListUser(spacePublicId, pageNumber),
    [spacePublicId, pageNumber],
  );
  const membersResource = useResource(
    `members:${spacePublicId}:${pageNumber}`,
    membersLoader,
  );
  const members = membersResource.data?.items ?? [];
  const pagination = membersResource.data ?? {
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };
  const loadMembers = (page: number) => {
    if (page !== pageNumber) setPageNumber(page);
    else void membersResource.reload();
  };
  const [selectedMember, setSelectedMember] = useState<UserDataSpaceDto | null>(
    null,
  );
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);

  const handleOpenMember = (member: UserDataSpaceDto) => {
    setSelectedMember(member);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailPanelOpen(false);
  };

  const handleRoleChanged = () => {
    setIsDetailPanelOpen(false);
    loadMembers(pageNumber);
  };

  const handleRemoved = () => {
    setIsDetailPanelOpen(false);
    setPageNumber(1);
    loadMembers(1);
  };

  const handleAdded = () => {
    setIsAddPanelOpen(false);
    setPageNumber(1);
    loadMembers(1);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-full min-w-0 break-words">
          <h1 className="font-display text-ink text-3xl font-semibold">
            Members
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            {space.name}
            {membersResource.data &&
              ` · ${members.length} members on this page`}
          </p>
        </div>
        {canManage && (
          <Button
            type="button"
            onClick={() => setIsAddPanelOpen(true)}
            className="bg-accent text-on-accent flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
          >
            <Plus size={16} />
            Add member
          </Button>
        )}
      </div>

      <ResourceState
        isLoading={membersResource.isLoading}
        hasData={membersResource.data !== null}
        error={membersResource.error}
        onRetry={membersResource.reload}
      >
        <UsersTable
          members={members}
          onOpenMember={handleOpenMember}
          canManage={canManage}
          onAddMember={canManage ? () => setIsAddPanelOpen(true) : undefined}
        />

        <Pagination
          pageNumber={pageNumber}
          totalPages={pagination.totalPages}
          hasPrevious={pagination.hasPrevious}
          hasNext={pagination.hasNext}
          onPageChange={setPageNumber}
        />
      </ResourceState>

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
