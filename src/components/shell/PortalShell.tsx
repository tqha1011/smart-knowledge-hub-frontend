import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
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
import { unansweredQuestionService } from "../../services/unansweredQuestion";
import { toCurrentUser, userService } from "../../services/userService";
import { toErrorMessage } from "../../shared/handleApiError";
import type {
  CurrentUser,
  Space,
  SpaceListItemDto,
  SpaceMembership,
  UnansweredQuestionData,
} from "../../types";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";

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

  // null = still loading. Fetched once per mount — a Space switch changes
  // the URL's pathname, which re-keys <Routes> in App.tsx and remounts this
  // component fresh, so there's no separate spaceId-change effect to write.
  const [spaces, setSpaces] = useState<SpaceListItemDto[] | null>(null);
  const [meUser, setMeUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let isActive = true;
    knowledgeSpaceService
      .getUserSpaces()
      .then((response) => {
        if (isActive) setSpaces(response.items);
      })
      .catch((error: ApiErrorResponse) => {
        if (isActive) toast.error(toErrorMessage(error));
      });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    userService
      .getMe()
      .then((dto) => {
        if (isActive) setMeUser(toCurrentUser(dto));
      })
      .catch((error: ApiErrorResponse) => {
        if (isActive) toast.error(toErrorMessage(error));
      });
    return () => {
      isActive = false;
    };
  }, []);

  // Lifted here (not into DocumentLibrary) because the gap count also
  // feeds the sidebar/rail/mobile-drawer badges, which are siblings of
  // DocumentLibrary, not descendants. Fetched off the route param directly
  // (not the resolved Space entry) so this doesn't have to wait on `spaces`
  // — declared above any conditional return, since hooks can't be called
  // conditionally.
  const [knowledgeGaps, setKnowledgeGaps] = useState<UnansweredQuestionData[]>(
    [],
  );

  // Reusable for the post-resolve refetch (called from an event handler,
  // not an effect) — the mount fetch below is written inline instead of
  // calling this, since calling a setState-bearing function from inside an
  // effect body trips react-hooks/set-state-in-effect.
  const loadKnowledgeGaps = useCallback(async () => {
    if (!spaceId) return;
    try {
      const response =
        await unansweredQuestionService.getUnansweredQuestions(spaceId);
      setKnowledgeGaps(response.items);
    } catch (error) {
      toast.error(toErrorMessage(error as ApiErrorResponse));
    }
  }, [spaceId]);

  useEffect(() => {
    if (!spaceId) return;
    let isActive = true;
    unansweredQuestionService
      .getUnansweredQuestions(spaceId)
      .then((response) => {
        if (isActive) setKnowledgeGaps(response.items);
      })
      .catch((error: ApiErrorResponse) => {
        if (isActive) toast.error(toErrorMessage(error));
      });
    return () => {
      isActive = false;
    };
  }, [spaceId]);

  const needsAttentionCount = knowledgeGaps.length;

  if (spaces === null || meUser === null) {
    return (
      <div className="bg-bg text-ink-muted flex h-dvh items-center justify-center text-sm">
        Loading…
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

  // Ask AI isn't wired to a real backend yet (still a mock chat flow), so
  // there's no server-side event to react to here — just resync with the
  // real queue rather than fabricating a local entry with a fake publicId,
  // which "Resolve" couldn't actually act on.
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
              onOpenMobileNav={() => setIsMobileNavOpen(true)}
            />

            {/* Main content area */}
            <main className="flex-1 overflow-y-auto p-6 pb-24 sm:pb-6">
              {(activeNavKey === "documents" ||
                activeNavKey === "needs-attention") && (
                <DocumentLibrary
                  space={selectedSpace}
                  canManage={canManage}
                  activeTab={
                    activeNavKey === "needs-attention"
                      ? "needs-attention"
                      : "all"
                  }
                  onTabChange={handleLibraryTabChange}
                  knowledgeGaps={knowledgeGaps}
                  onGapsChanged={loadKnowledgeGaps}
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
        />
      </div>
    </PageTransition>
  );
}
