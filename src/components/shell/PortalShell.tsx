import { useEffect, useState } from "react";
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
  spaceColorPalette,
} from "./shellMockData";
import { DocumentLibrary } from "../documentComponent/DocumentLibrary";
import type { DocumentLibraryTab } from "../documentComponent/DocumentLibrary";
import { UsersRolesPage } from "../usersComponent/UsersRolesPage";
import { PageTransition } from "../common/PageTransition";
import { knowledgeSpaceService } from "../../services/spaceService";
import { toErrorMessage } from "../../shared/handleApiError";
import type {
  KnowledgeGapItem,
  Space,
  SpaceListItemDto,
  SpaceMembership,
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

  // Lifted here (not into DocumentLibrary) because the gap count also
  // feeds the sidebar/rail/mobile-drawer badges, which are siblings of
  // DocumentLibrary, not descendants. Keyed directly off the route param
  // (not the fetched Space entry) so this hook doesn't have to wait on
  // `spaces` to resolve — declared above any conditional return, since
  // hooks can't be called conditionally.
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGapItem[]>(() =>
    mockKnowledgeGaps.filter((gap) => gap.spaceId === spaceId),
  );
  const needsAttentionCount = knowledgeGaps.length;

  if (spaces === null) {
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
  // its own role — mockCurrentUser only supplies identity fields (name,
  // avatar, isAdmin) now; the memberships list itself is real.
  const memberships: SpaceMembership[] = spaces.map((item, index) => ({
    space: toSpace(item, spaceColorPalette[index % spaceColorPalette.length]),
    role: item.role,
  }));
  const currentUser = { ...mockCurrentUser, memberships };

  const canManage = currentUser.isAdmin || currentEntry.role === "Editor";

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
                  onResolveGap={handleResolveGap}
                  onIgnoreGap={handleIgnoreGap}
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
