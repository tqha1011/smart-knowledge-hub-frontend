import type {
  CurrentUser,
  DocumentSummary,
  KnowledgeGapItem,
  Space,
} from "../../types";

// MOCK: stand-in for `GET /spaces` (the Spaces the current user can access).
export const mockSpaces: Space[] = [
  { id: "engineering", name: "Engineering", colorDot: "#0E8F82" },
  { id: "hr", name: "HR", colorDot: "#B8860B" },
  { id: "sales", name: "Sales", colorDot: "#6E6A5F" },
];

// MOCK: stand-in for `GET /me` (current user + their (Space, role) pairs).
export const mockCurrentUser: CurrentUser = {
  id: "u1",
  name: "Alex Rivera",
  email: "alex@company.com",
  avatarInitials: "AR",
  isAdmin: true,
  memberships: [
    { space: mockSpaces[0], role: "Editor" },
    { space: mockSpaces[1], role: "Employee" },
    { space: mockSpaces[2], role: "Employee" },
  ],
};

// MOCK: stand-in for `GET /spaces/:spaceId/documents`.
export const mockDocuments: DocumentSummary[] = [
  {
    id: "doc-1",
    spaceId: "engineering",
    name: "API Design Guidelines.pdf",
    fileType: "pdf",
    category: "Architecture",
    updatedBy: { name: "Priya Nair", avatarInitials: "PN" },
    updatedAt: "2026-08-05T10:00:00Z",
    citationCount: 12,
  },
  {
    id: "doc-2",
    spaceId: "engineering",
    name: "Incident Response Runbook.md",
    fileType: "markdown",
    category: "Runbook",
    updatedBy: { name: "Alex Rivera", avatarInitials: "AR" },
    updatedAt: "2026-07-28T10:00:00Z",
    citationCount: 27,
  },
  {
    id: "doc-3",
    spaceId: "engineering",
    name: "Onboarding Checklist.docx",
    fileType: "docx",
    category: "Onboarding",
    updatedBy: { name: "Priya Nair", avatarInitials: "PN" },
    updatedAt: "2026-06-14T10:00:00Z",
    citationCount: 4,
  },
  {
    id: "doc-4",
    spaceId: "engineering",
    name: "Deployment Pipeline Overview.pdf",
    fileType: "pdf",
    category: "Architecture",
    updatedBy: { name: "Sam Ortiz", avatarInitials: "SO" },
    updatedAt: "2026-08-09T10:00:00Z",
    citationCount: 8,
  },
  {
    id: "doc-5",
    spaceId: "hr",
    name: "Time Off Policy.pdf",
    fileType: "pdf",
    category: "Policy",
    updatedBy: { name: "Jordan Lee", avatarInitials: "JL" },
    updatedAt: "2026-07-01T10:00:00Z",
    citationCount: 15,
  },
  {
    id: "doc-6",
    spaceId: "hr",
    name: "New Hire Onboarding.docx",
    fileType: "docx",
    category: "Onboarding",
    updatedBy: { name: "Jordan Lee", avatarInitials: "JL" },
    updatedAt: "2026-08-02T10:00:00Z",
    citationCount: 6,
  },
  {
    id: "doc-7",
    spaceId: "sales",
    name: "Pricing Playbook.pdf",
    fileType: "pdf",
    category: "Playbook",
    updatedBy: { name: "Morgan Diaz", avatarInitials: "MD" },
    updatedAt: "2026-08-10T10:00:00Z",
    citationCount: 19,
  },
];

function countDocuments(spaceId: string): number {
  return mockDocuments.filter((doc) => doc.spaceId === spaceId).length;
}

// MOCK: per-space stats shown on the Spaces overview cards — stands in for
// whatever summary endpoint would back that grid. documentCount is derived
// from mockDocuments so the two can't drift out of sync.
export const mockSpaceStats: Record<
  string,
  { documentCount: number; needsAttentionCount: number }
> = {
  engineering: {
    documentCount: countDocuments("engineering"),
    needsAttentionCount: 3,
  },
  hr: { documentCount: countDocuments("hr"), needsAttentionCount: 0 },
  sales: {
    documentCount: countDocuments("sales"),
    needsAttentionCount: 1,
  },
};

// MOCK: stand-in for `GET /spaces/:spaceId/knowledge-gaps`. Counts per
// spaceId intentionally match mockSpaceStats[spaceId].needsAttentionCount.
export const mockKnowledgeGaps: KnowledgeGapItem[] = [
  {
    id: "gap-1",
    spaceId: "engineering",
    question: "What's our rollback procedure for a failed production deploy?",
    askedCount: 5,
  },
  {
    id: "gap-2",
    spaceId: "engineering",
    question: "Who owns the on-call rotation for the payments service?",
    askedCount: 2,
  },
  {
    id: "gap-3",
    spaceId: "engineering",
    question: "What's the retention policy for staging database snapshots?",
    askedCount: 1,
  },
  {
    id: "gap-4",
    spaceId: "sales",
    question: "What discount approval is needed for multi-year contracts?",
    askedCount: 1,
  },
];
