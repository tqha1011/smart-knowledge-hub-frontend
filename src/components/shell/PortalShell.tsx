import { useResource } from "../common/useResource";
import { ResourceState, Skeleton } from "../common/ResourceState";
import { useCallback, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { IconRail } from "./IconRail";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { BottomTabBar } from "./BottomTabBar";
import { AskAiPanel } from "../askAiComponent/AskAiPanel";
import type { ShellNavKey } from "./navItems";
import { spaceColorPalette } from "./shellMockData";
import { DocumentLibrary } from "../documentComponent/DocumentLibrary";
import type { DocumentLibraryTab } from "../documentComponent/DocumentLibrary";
import { UsersRolesPage } from "../usersComponent/UsersRolesPage";
import { PageTransition } from "../common/PageTransition";
import { knowledgeSpaceService } from "../../services/spaceService";
import { unansweredQuestionService } from "../../services/unansweredQuestionService";
import { toCurrentUser, userService } from "../../services/userService";
import type { Space, SpaceListItemDto, SpaceMembership } from "../../types";

function toSpace(item: SpaceListItemDto, colorDot: string): Space {
  return { id: item.publicId, name: item.name, colorDot };
}

// Portal shell: icon rail + labeled sidebar + topbar on desktop, collapsing
// to a hamburger drawer + bottom tab bar on mobile (see spec's responsive
// breakpoints — 980px drops the sidebar, 640px drops the rail too).
export function PortalShell() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const [activeNavKey, setActiveNavKey] = useState<ShellNavKey>("documents");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [documentSearch, setDocumentSearch] = useState({
    query: "",
    revision: 0,
  });
  const handleDocumentSearch = (query: string) => {
    const trimmed = query.trim();
    setSearchValue(trimmed);
    setDocumentSearch((previous) => ({
      query: trimmed,
      revision: previous.revision + 1,
    }));
    setActiveNavKey("documents");
  };

  const spacesLoader = useCallback(
    async () => (await knowledgeSpaceService.getUserSpaces()).items,
    [],
  );
  const meLoader = useCallback(
    async () => toCurrentUser(await userService.getMe()),
    [],
  );
  const spacesResource = useResource("shell-spaces", spacesLoader);
  const meResource = useResource("current-user", meLoader);
  const spaces = spacesResource.data;
  const meUser = meResource.data;
  const gapsLoader = useCallback(
    () => unansweredQuestionService.getUnansweredQuestions(spaceId!),
    [spaceId],
  );
  const gapsResource = useResource(
    `gaps:${spaceId}`,
    gapsLoader,
    0,
    Boolean(spaceId),
  );
  const knowledgeGaps = gapsResource.data?.items ?? [];
  const loadKnowledgeGaps = gapsResource.reload;

  // Bumped whenever the Assistant answers a question — a citation can
  // change a document's `cited` count, so DocumentLibrary refetches its
  // current page in response instead of only on mount/page-change/save.
  const [documentsRefreshTick, setDocumentsRefreshTick] = useState(0);
  const handleAssistantAnswered = () => {
    setDocumentsRefreshTick((tick) => tick + 1);
  };

  const needsAttentionCount = knowledgeGaps.length;

  if (spaces === null || meUser === null) {
    const failed = spacesResource.error ? spacesResource : meResource;
    return (
      <div className="bg-bg min-h-dvh p-4 sm:p-6">
        <ResourceState
          isLoading={spacesResource.isLoading || meResource.isLoading}
          hasData={false}
          error={failed.error}
          onRetry={() => {
            void spacesResource.reload();
            void meResource.reload();
          }}
        >
          <Skeleton />
        </ResourceState>
      </div>
    );
  }

  const currentEntryIndex = spaces.findIndex((s) => s.publicId === spaceId);
  if (currentEntryIndex === -1) {
    return <Navigate to="/spaces" replace />;
  }
  const currentEntry = spaces[currentEntryIndex];
  const selectedSpace = toSpace(
    currentEntry,
    spaceColorPalette[currentEntryIndex % spaceColorPalette.length],
  );

  // Space switcher needs every Space the user belongs to, each paired with
  // its own role — `GET /users/me` supplies identity fields (name, avatar,
  // isAdmin) only, so the memberships list is attached from the separate
  // Space list fetch above.
  const memberships: SpaceMembership[] = spaces.map((item, index) => ({
    space: toSpace(item, spaceColorPalette[index % spaceColorPalette.length]),
    role: item.role,
  }));
  const currentUser = { ...meUser, memberships };

  const canManage = currentUser.isAdmin || currentEntry.role === "Editor";

  // Refresh the real queue after an answer without sources.
  const handleLogKnowledgeGap = () => {
    loadKnowledgeGaps();
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
              spaceName={selectedSpace.name}
              searchValue={searchValue}
              onSearchChange={(value) => {
                setSearchValue(value);
                if (!value.trim() && documentSearch.query) {
                  setDocumentSearch((previous) => ({
                    query: "",
                    revision: previous.revision + 1,
                  }));
                }
              }}
              onSearch={handleDocumentSearch}
              onOpenMobileNav={() => setIsMobileNavOpen(true)}
            />

            {/* Main content area */}
            <main className="portal-content min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {(activeNavKey === "documents" ||
                activeNavKey === "needs-attention") && (
                <DocumentLibrary
                  space={selectedSpace}
                  canManage={canManage}
                  searchQuery={documentSearch.query}
                  searchRevision={documentSearch.revision}
                  onClearSearch={() => handleDocumentSearch("")}
                  activeTab={
                    activeNavKey === "needs-attention"
                      ? "needs-attention"
                      : "all"
                  }
                  onTabChange={handleLibraryTabChange}
                  knowledgeGaps={knowledgeGaps}
                  knowledgeGapsLoading={gapsResource.isLoading}
                  knowledgeGapsError={gapsResource.error}
                  knowledgeGapsLoaded={gapsResource.data !== null}
                  onGapsChanged={loadKnowledgeGaps}
                  refreshSignal={documentsRefreshTick}
                />
              )}
              {activeNavKey === "users-roles" && (
                <UsersRolesPage space={selectedSpace} canManage={canManage} />
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
          onAnswered={handleAssistantAnswered}
        />
      </div>
    </PageTransition>
  );
}
