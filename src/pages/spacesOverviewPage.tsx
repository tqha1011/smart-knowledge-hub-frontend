import { motion, useReducedMotion } from "framer-motion";
import { useResource } from "../components/common/useResource";
import { ResourceState } from "../components/common/ResourceState";
import { useCallback, useState } from "react";
import { LogOut, Plus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { PageTransition } from "../components/common/PageTransition";
import { Pagination } from "../components/common/Pagination";
import { CreateSpacePanel } from "../components/spaceComponent/CreateSpacePanel";
import { spaceColorPalette } from "../components/shell/shellMockData";
import { authService } from "../services/authService";
import { disconnectRealtime } from "../services/realtimeService";
import { knowledgeSpaceService } from "../services/spaceService";
import { toCurrentUser, userService } from "../services/userService";
import { clearSession, getRefreshToken } from "../shared/authSession";

// Landing page after login — every Space the current user belongs to, one
// card each. Both Admin and Employee land here; only per-action gating
// (isAdmin for the global "New space" action, isAdmin || Editor-in-that-Space
// for the per-card "Manage" action) hides buttons from Employees. Clicking a
// card itself is what routes into that Space's Document Library (portal shell).
export function SpacesOverviewPage() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [pageNumber, setPageNumber] = useState(1);
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
  const meLoader = useCallback(
    async () => toCurrentUser(await userService.getMe()),
    [],
  );
  const meResource = useResource("current-user", meLoader);
  const currentUser = meResource.data;
  const spacesLoader = useCallback(
    () => knowledgeSpaceService.getUserSpaces(pageNumber),
    [pageNumber],
  );
  const spacesResource = useResource(`spaces:${pageNumber}`, spacesLoader);
  const spaces = spacesResource.data?.items ?? [];
  const pagination = spacesResource.data ?? {
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      // best-effort — still clear the local session even if this fails
    } finally {
      disconnectRealtime();
      clearSession();
      navigate("/login", { replace: true });
    }
  };

  if (currentUser === null) {
    return (
      <div className="bg-bg min-h-dvh p-4 sm:p-6">
        <ResourceState
          isLoading={meResource.isLoading}
          hasData={false}
          error={meResource.error}
          onRetry={meResource.reload}
          kind="cards"
        >
          {null}
        </ResourceState>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="bg-bg min-h-dvh">
        {/* Lightweight top bar — this page sits outside the portal shell, no Space is selected yet */}
        <header className="border-border flex items-center justify-between border-b px-4 py-4 sm:px-6">
          <span className="bg-accent-soft font-display text-accent flex size-9 items-center justify-center rounded-md text-sm font-semibold">
            K
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span
              aria-label={currentUser.name}
              title={currentUser.name}
              className="bg-avatar-bg text-avatar-fg flex size-9 items-center justify-center rounded-full font-sans text-xs font-semibold"
            >
              {currentUser.avatarInitials}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              className="text-ink-muted hover:bg-surface-sunken flex size-9 items-center justify-center rounded-md"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-full min-w-0 break-words">
              <h1 className="font-display text-ink text-3xl font-semibold">
                Good morning, {currentUser.name.split(" ")[0]}
              </h1>
              <p className="text-ink-muted mt-1 text-sm">
                Choose a space to continue
              </p>
            </div>

            {/* Admin-only, global action. Space creation itself is a
                documented non-goal of the design spec, but the app needs a
                real path to create one, so this panel isn't spec'd chrome —
                it reuses the app's established slide-over pattern. */}
            {currentUser.isAdmin && (
              <button
                type="button"
                onClick={() => setIsCreateSpaceOpen(true)}
                className="border-border text-ink hover:bg-surface-sunken flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
              >
                <Plus size={16} />
                New space
              </button>
            )}
          </div>

          <ResourceState
            isLoading={spacesResource.isLoading}
            hasData={spacesResource.data !== null}
            error={spacesResource.error}
            onRetry={spacesResource.reload}
            kind="cards"
          >
            {spaces.length === 0 && (
              <div className="border-border text-ink-muted rounded-lg border border-dashed p-8 text-center text-sm">
                {currentUser.isAdmin
                  ? "Create a space to start sharing knowledge."
                  : "No spaces yet. Contact an administrator to join a space."}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {spaces.map((space, index) => {
                // Space-scoped action: global Admin OR Editor in *this* Space —
                // not gated on isAdmin alone, per the (Space, role) permission model.
                const canManage =
                  currentUser.isAdmin || space.role === "Editor";
                const colorDot =
                  spaceColorPalette[index % spaceColorPalette.length];

                return (
                  <motion.div
                    key={space.publicId}
                    whileHover={reduced ? undefined : { y: -2 }}
                    transition={{ duration: reduced ? 0 : 0.12 }}
                    className="border-border bg-surface hover:border-accent relative rounded-lg border"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/spaces/${space.publicId}`)}
                      className="flex h-full w-full flex-col items-start gap-4 rounded-lg p-5 text-left"
                    >
                      <span
                        aria-hidden
                        className="size-3 rounded-full"
                        style={{ backgroundColor: colorDot }}
                      />
                      <div className="w-full min-w-0 pr-8">
                        <h2 className="font-display text-ink text-xl font-semibold break-words">
                          {space.name}
                        </h2>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-ink-muted text-xs">
                            {space.role}
                          </span>
                          <span className="bg-surface-sunken text-ink-muted min-w-0 rounded-full px-2 py-0.5 text-xs font-medium [overflow-wrap:anywhere]">
                            {space.typeName}
                          </span>
                        </div>
                      </div>
                      <div className="text-ink-muted flex items-center gap-3 text-xs">
                        <span>{space.totalDocuments} documents</span>
                      </div>
                    </button>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() =>
                          toast.info("Space management isn't built yet.")
                        }
                        aria-label={`Manage ${space.name}`}
                        className="text-ink-muted hover:bg-surface-sunken absolute top-3 right-3 flex size-11 items-center justify-center rounded-md"
                      >
                        <Settings size={15} />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <Pagination
              pageNumber={pageNumber}
              totalPages={pagination.totalPages}
              hasPrevious={pagination.hasPrevious}
              hasNext={pagination.hasNext}
              onPageChange={setPageNumber}
            />
          </ResourceState>
        </main>
      </div>

      <CreateSpacePanel
        isOpen={isCreateSpaceOpen}
        onClose={() => setIsCreateSpaceOpen(false)}
        onCreated={() => {
          if (pageNumber === 1) void spacesResource.reload();
          else setPageNumber(1);
        }}
      />
    </PageTransition>
  );
}
