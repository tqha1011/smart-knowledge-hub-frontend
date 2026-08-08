import { FileText, MessageSquareWarning, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ShellNavKey = "documents" | "needs-attention" | "users-roles";

export interface ShellNavItem {
  key: ShellNavKey;
  label: string;
  icon: LucideIcon;
}

// "Knowledge" eyebrow — Document Library and its knowledge-gap queue tab.
export const KNOWLEDGE_NAV_ITEMS: ShellNavItem[] = [
  { key: "documents", label: "Documents", icon: FileText },
  {
    key: "needs-attention",
    label: "Needs attention",
    icon: MessageSquareWarning,
  },
];

// "Assistant" eyebrow — opens the floating Ask AI panel, does not navigate,
// so it deliberately has no ShellNavKey / active-page state of its own.
export const ASSISTANT_NAV_LABEL = "Ask AI";
export const ASSISTANT_NAV_ICON = Sparkles;

// "Admin" eyebrow — Admin-only, hidden entirely for Employee/Editor.
export const ADMIN_NAV_ITEM: ShellNavItem = {
  key: "users-roles",
  label: "Users & Roles",
  icon: Users,
};
