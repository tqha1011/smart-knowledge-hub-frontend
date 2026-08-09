import { LogOut, Plus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { PageTransition } from "../components/common/PageTransition";
import {
  mockCurrentUser,
  mockSpaceStats,
} from "../components/shell/shellMockData";

// Landing page after login — every Space the current user belongs to, one
// card each. Both Admin and Employee land here; only per-action gating
// (isAdmin for the global "New space" action, isAdmin || Editor-in-that-Space
// for the per-card "Manage" action) hides buttons from Employees. Clicking a
// card itself is what routes into that Space's Document Library (portal shell).
export function SpacesOverviewPage() {
  const navigate = useNavigate();
  const currentUser = mockCurrentUser; // MOCK: stand-in for GET /me, no auth session yet

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login", { replace: true });
  };

  return (
    <PageTransition>
      <div className="bg-bg min-h-dvh">
        {/* Lightweight top bar — this page sits outside the portal shell, no Space is selected yet */}
        <header className="border-border flex items-center justify-between border-b px-6 py-4">
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

        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              {/* MOCK: greeting uses mockCurrentUser.name, no real time-of-day logic */}
              <h1 className="font-display text-ink text-3xl font-semibold">
                Good morning, {currentUser.name.split(" ")[0]}
              </h1>
              <p className="text-ink-muted mt-1 text-sm">
                Choose a space to continue
              </p>
            </div>

            {/* Admin-only, global action. Space creation is a documented
                non-goal for this spec, so this is a stub, not a real flow. */}
            {currentUser.isAdmin && (
              <button
                type="button"
                onClick={() => toast.info("Space creation isn't built yet.")}
                className="border-border text-ink hover:bg-surface-sunken flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
              >
                <Plus size={16} />
                New space
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentUser.memberships.map(({ space, role }) => {
              const stats = mockSpaceStats[space.id];
              // Space-scoped action: global Admin OR Editor in *this* Space —
              // not gated on isAdmin alone, per the (Space, role) permission model.
              const canManage = currentUser.isAdmin || role === "Editor";

              return (
                <div key={space.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => navigate(`/spaces/${space.id}`)}
                    className="border-border bg-surface hover:border-accent flex w-full flex-col items-start gap-3 rounded-lg border p-5 text-left shadow-sm"
                  >
                    <span
                      aria-hidden
                      className="size-3 rounded-full"
                      style={{ backgroundColor: space.colorDot }}
                    />
                    <div>
                      <h2 className="font-display text-ink text-lg font-semibold">
                        {space.name}
                      </h2>
                      <span className="text-ink-muted text-xs">{role}</span>
                    </div>
                    {/* MOCK: document/needs-attention counts from mockSpaceStats */}
                    {stats && (
                      <div className="text-ink-muted flex items-center gap-3 font-mono text-xs">
                        <span>{stats.documentCount} documents</span>
                        {stats.needsAttentionCount > 0 && (
                          <span className="bg-warn-bg text-warn-fg rounded-full px-1.5 py-0.5">
                            {stats.needsAttentionCount} needs attention
                          </span>
                        )}
                      </div>
                    )}
                  </button>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() =>
                        toast.info("Space management isn't built yet.")
                      }
                      aria-label={`Manage ${space.name}`}
                      className="text-ink-muted hover:bg-surface-sunken absolute top-4 right-4 flex size-8 items-center justify-center rounded-md opacity-0 group-hover:opacity-100"
                    >
                      <Settings size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
