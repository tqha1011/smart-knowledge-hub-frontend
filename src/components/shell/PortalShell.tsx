import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { IconRail } from "./IconRail";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { BottomTabBar } from "./BottomTabBar";
import { AskAiPanel } from "../askAiComponent/AskAiPanel";
import type { ShellNavKey } from "./navItems";
import {
  mockCurrentUser,
  mockKnowledgeGaps,
  mockOrgUsers,
  mockSpaces,
  setMockOrgUsers,
} from "./shellMockData";
import { DocumentLibrary } from "../documentComponent/DocumentLibrary";
import type { DocumentLibraryTab } from "../documentComponent/DocumentLibrary";
import { UsersRolesPage } from "../usersComponent/UsersRolesPage";
import { PageTransition } from "../common/PageTransition";
import type {
  InviteCandidate,
  KnowledgeGapItem,
  OrgUser,
  Space,
  UserAccessUpdate,
} from "../../types";

// Portal shell: icon rail + labeled sidebar + topbar on desktop, collapsing
// to a hamburger drawer + bottom tab bar on mobile (see spec's responsive
// breakpoints — 980px drops the sidebar, 640px drops the rail too).
// Only the chrome is real here; the routed pages themselves (Document
// Library, Needs attention queue, Users & Roles) are separate, later pieces —
// the content pane below just proves each nav destination is reachable.
export function PortalShell() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const [activeNavKey, setActiveNavKey] = useState<ShellNavKey>("documents");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);

  const currentUser = mockCurrentUser; // MOCK: no auth session yet, stands in for the logged-in user

  // Space comes from the route (/spaces/:spaceId), not local state, so
  // switching Spaces updates the URL and an unknown id bounces back to the overview grid.
  const membership = currentUser.memberships.find(
    (m) => m.space.id === spaceId,
  );

  // Lifted here (not into DocumentLibrary) because the gap count also
  // feeds the sidebar/rail/mobile-drawer badges, which are siblings of
  // DocumentLibrary, not descendants. A fresh PortalShell mount (Space
  // switches remount this component via the router key) reseeds from mock
  // data, same pattern as mockCurrentUser elsewhere in this codebase.
  // NOTE: initialized from `membership?.space.id` (not `selectedSpace.id`)
  // and declared above the `if (!membership)` early return below — hooks
  // can't be called conditionally, so this can't sit after that guard.
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGapItem[]>(() =>
    mockKnowledgeGaps.filter((gap) => gap.spaceId === membership?.space.id),
  );
  const needsAttentionCount = knowledgeGaps.length;

  // Same lifted-state pattern as knowledgeGaps above: users is
  // org-wide (not filtered by Space), but UsersRolesPage is still
  // conditionally rendered (unmounts on nav switch), so it must live here
  // to survive that round-trip. Unlike knowledgeGaps, this state must ALSO
  // survive a Space switch — that remounts PortalShell itself and rebuilds
  // this seed — so the handlers below write back through setMockOrgUsers()
  // instead of only calling setUsers(). knowledgeGaps is legitimately
  // Space-scoped and should reseed per Space; users isn't.
  const [users, setUsers] = useState<OrgUser[]>(() => mockOrgUsers);

  if (!membership) {
    return <Navigate to="/spaces" replace />;
  }
  const selectedSpace = membership.space;

  const canManageDocuments =
    currentUser.isAdmin || membership.role === "Editor";

  const handleResolveGap = (id: string) => {
    setKnowledgeGaps((prev) => prev.filter((gap) => gap.id !== id));
    toast.success("Marked resolved.");
  };

  const handleIgnoreGap = (id: string) => {
    setKnowledgeGaps((prev) => prev.filter((gap) => gap.id !== id));
    toast.info("Question ignored.");
  };

  const handleLogKnowledgeGap = (question: string) => {
    setKnowledgeGaps((prev) => {
      const existing = prev.find(
        (gap) => gap.question.toLowerCase() === question.toLowerCase(),
      );
      if (existing) {
        return prev.map((gap) =>
          gap.id === existing.id
            ? { ...gap, askedCount: gap.askedCount + 1 }
            : gap,
        );
      }
      return [
        {
          id: `gap-${Date.now()}`,
          spaceId: selectedSpace.id,
          question,
          askedCount: 1,
        },
        ...prev,
      ];
    });
  };

  const handleUpdateUserAccess = (userId: string, update: UserAccessUpdate) => {
    setUsers((prev) => {
      const next = prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              isAdmin: update.isAdmin,
              memberships: update.memberships,
            }
          : user,
      );
      setMockOrgUsers(next);
      return next;
    });
    toast.success("User access updated.");
  };

  const handleRemoveUser = (userId: string) => {
    setUsers((prev) => {
      const next = prev.filter((user) => user.id !== userId);
      setMockOrgUsers(next);
      return next;
    });
    toast.success("User removed.");
  };

  const handleInvitePeople = (candidates: InviteCandidate[]) => {
    setUsers((prev) => {
      const next = [
        ...prev,
        ...candidates.map((candidate, index) => {
          const space = mockSpaces.find((s) => s.id === candidate.spaceId);
          return {
            id: `user-${Date.now()}-${index}`,
            name: candidate.email.split("@")[0],
            email: candidate.email,
            avatarInitials: candidate.email.slice(0, 2).toUpperCase(),
            isAdmin: false,
            status: "invited" as const,
            memberships: space ? [{ space, role: candidate.role }] : [],
          };
        }),
      ];
      setMockOrgUsers(next);
      return next;
    });
    toast.success(
      `Sent ${candidates.length} invite${candidates.length === 1 ? "" : "s"}.`,
    );
  };

  const handleLibraryTabChange = (tab: DocumentLibraryTab) => {
    setActiveNavKey(
      tab === "needs-attention" ? "needs-attention" : "documents",
    );
  };

  const handleSelectSpace = (space: Space) => navigate(`/spaces/${space.id}`);

  return (
    <PageTransition>
      <div className="bg-bg flex h-dvh flex-col">
        <div className="flex min-h-0 flex-1">
          {/* Icon rail — persistent from sm (640px) up */}
          <IconRail
            activeNavKey={activeNavKey}
            onNavigate={setActiveNavKey}
            isAdmin={currentUser.isAdmin}
            needsAttentionCount={needsAttentionCount}
            isAskAiOpen={isAskAiOpen}
            onToggleAskAi={() => setIsAskAiOpen((prev) => !prev)}
          />

          {/* Labeled sidebar — only from shell (980px) up */}
          <Sidebar
            currentUser={currentUser}
            selectedSpace={selectedSpace}
            onSelectSpace={handleSelectSpace}
            activeNavKey={activeNavKey}
            onNavigate={setActiveNavKey}
            needsAttentionCount={needsAttentionCount}
            isAskAiOpen={isAskAiOpen}
            onToggleAskAi={() => setIsAskAiOpen((prev) => !prev)}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar
              currentUser={currentUser}
              onOpenMobileNav={() => setIsMobileNavOpen(true)}
            />

            {/* Main content area */}
            <main className="flex-1 overflow-y-auto p-6 pb-24 sm:pb-6">
              {(activeNavKey === "documents" ||
                activeNavKey === "needs-attention") && (
                <DocumentLibrary
                  space={selectedSpace}
                  canManage={canManageDocuments}
                  activeTab={
                    activeNavKey === "needs-attention"
                      ? "needs-attention"
                      : "all"
                  }
                  onTabChange={handleLibraryTabChange}
                  knowledgeGaps={knowledgeGaps}
                  onResolveGap={handleResolveGap}
                  onIgnoreGap={handleIgnoreGap}
                />
              )}
              {activeNavKey === "users-roles" && (
                <UsersRolesPage
                  users={users}
                  allSpaces={mockSpaces}
                  onUpdateUserAccess={handleUpdateUserAccess}
                  onRemoveUser={handleRemoveUser}
                  onInvitePeople={handleInvitePeople}
                />
              )}
            </main>
          </div>
        </div>

        {/* Mobile-only chrome: hamburger drawer + bottom tab bar, both < sm (640px) */}
        <MobileNavDrawer
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          currentUser={currentUser}
          selectedSpace={selectedSpace}
          onSelectSpace={handleSelectSpace}
          activeNavKey={activeNavKey}
          onNavigate={setActiveNavKey}
          needsAttentionCount={needsAttentionCount}
          isAskAiOpen={isAskAiOpen}
          onToggleAskAi={() => setIsAskAiOpen((prev) => !prev)}
        />
        <BottomTabBar
          activeNavKey={activeNavKey}
          onNavigate={setActiveNavKey}
          isAdmin={currentUser.isAdmin}
          isAskAiOpen={isAskAiOpen}
          onToggleAskAi={() => setIsAskAiOpen((prev) => !prev)}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />

        {/* Ask AI floating panel — spec piece 5 */}
        <AskAiPanel
          isOpen={isAskAiOpen}
          onClose={() => setIsAskAiOpen(false)}
          selectedSpaceId={selectedSpace.id}
          selectedSpaceName={selectedSpace.name}
          onLogKnowledgeGap={handleLogKnowledgeGap}
        />
      </div>
    </PageTransition>
  );
}
