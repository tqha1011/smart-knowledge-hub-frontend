import { useState } from "react";
import { IconRail } from "./IconRail";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { BottomTabBar } from "./BottomTabBar";
import { AskAiStubPanel } from "./AskAiStubPanel";
import type { ShellNavKey } from "./navItems";
import {
  mockCurrentUser,
  mockNeedsAttentionCount,
  mockSpaces,
} from "./shellMockData";
import type { Space } from "../../types";

const NAV_PAGE_TITLE: Record<ShellNavKey, string> = {
  documents: "Documents",
  "needs-attention": "Needs attention",
  "users-roles": "Users & Roles",
};

// Portal shell: icon rail + labeled sidebar + topbar on desktop, collapsing
// to a hamburger drawer + bottom tab bar on mobile (see spec's responsive
// breakpoints — 980px drops the sidebar, 640px drops the rail too).
// Only the chrome is real here; the routed pages themselves (Document
// Library, Needs attention queue, Users & Roles) are separate, later pieces —
// the content pane below just proves each nav destination is reachable.
export function PortalShell() {
  const [activeNavKey, setActiveNavKey] = useState<ShellNavKey>("documents");
  const [selectedSpace, setSelectedSpace] = useState<Space>(mockSpaces[0]);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);

  const currentUser = mockCurrentUser; // MOCK: no auth session yet, stands in for the logged-in user

  return (
    <div className="bg-bg flex h-dvh flex-col">
      <div className="flex min-h-0 flex-1">
        {/* Icon rail — persistent from sm (640px) up */}
        <IconRail
          activeNavKey={activeNavKey}
          onNavigate={setActiveNavKey}
          isAdmin={currentUser.isAdmin}
          needsAttentionCount={mockNeedsAttentionCount}
          isAskAiOpen={isAskAiOpen}
          onToggleAskAi={() => setIsAskAiOpen((prev) => !prev)}
        />

        {/* Labeled sidebar — only from shell (980px) up */}
        <Sidebar
          currentUser={currentUser}
          selectedSpace={selectedSpace}
          onSelectSpace={setSelectedSpace}
          activeNavKey={activeNavKey}
          onNavigate={setActiveNavKey}
          needsAttentionCount={mockNeedsAttentionCount}
          isAskAiOpen={isAskAiOpen}
          onToggleAskAi={() => setIsAskAiOpen((prev) => !prev)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            currentUser={currentUser}
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
          />

          {/* Main content area — placeholder pane standing in for the routed page */}
          <main className="flex-1 overflow-y-auto p-6 pb-24 sm:pb-6">
            <p className="text-ink-muted mb-1 font-mono text-xs tracking-wide uppercase">
              {/* MOCK: subtitle format follows the spec's "{Space} · ..." pattern, count is a stand-in */}
              {selectedSpace.name} · placeholder content
            </p>
            <h1 className="font-display text-ink text-3xl font-semibold">
              {NAV_PAGE_TITLE[activeNavKey]}
            </h1>
            <div className="border-border text-ink-muted mt-6 flex min-h-64 items-center justify-center rounded-lg border border-dashed text-center text-sm">
              {activeNavKey === "documents" &&
                "Document Library UI is spec piece 2 — not built yet."}
              {activeNavKey === "needs-attention" &&
                "Needs attention (knowledge-gap queue) UI is spec piece 2 — not built yet."}
              {activeNavKey === "users-roles" &&
                "Users & Roles admin UI is spec piece 7 — not built yet."}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile-only chrome: hamburger drawer + bottom tab bar, both < sm (640px) */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        currentUser={currentUser}
        selectedSpace={selectedSpace}
        onSelectSpace={setSelectedSpace}
        activeNavKey={activeNavKey}
        onNavigate={setActiveNavKey}
        needsAttentionCount={mockNeedsAttentionCount}
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

      {/* Ask AI floating panel stub — spec piece 5, chrome only */}
      <AskAiStubPanel
        isOpen={isAskAiOpen}
        onClose={() => setIsAskAiOpen(false)}
        spaceCount={currentUser.memberships.length}
      />
    </div>
  );
}
