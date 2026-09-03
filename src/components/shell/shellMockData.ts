import type {
  CurrentUser,
  DocumentCitation,
  DocumentSummary,
  KnowledgeGapItem,
  Space,
  SpaceType,
} from "../../types";

// MOCK: stand-in for `GET /space-types`.
export const mockSpaceTypes: SpaceType[] = [
  { publicId: "department", name: "Department" },
  { publicId: "project", name: "Project" },
  { publicId: "practice-area", name: "Practice area" },
];

// Cycled through for Spaces created without an explicit color — pulled from
// the app's own token palette so new dots never clash with it.
export const spaceColorPalette = [
  "#0E8F82",
  "#B8860B",
  "#6E6A5F",
  "#2F7D5B",
  "#C0392B",
];

// MOCK: stand-in for `GET /spaces` (the Spaces the current user can access).
export const mockSpaces: Space[] = [
  {
    id: "engineering",
    name: "Engineering",
    type: mockSpaceTypes[0],
    colorDot: "#0E8F82",
  },
  { id: "hr", name: "HR", type: mockSpaceTypes[0], colorDot: "#B8860B" },
  {
    id: "sales",
    name: "Sales",
    type: mockSpaceTypes[0],
    colorDot: "#6E6A5F",
  },
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
    { space: mockSpaces[1], role: "Viewer" },
    { space: mockSpaces[2], role: "Viewer" },
  ],
};

// MOCK: stand-in for `GET /documents/:documentId/citations`. Backs the
// Document detail panel's "Cited by the Assistant" list. Each document's
// citationCount below is the sum of askedCount across its entries here.
// Declared before mockDocuments (not after) because mockDocuments calls
// countCitations() at module-evaluation time, and a `const` isn't
// initialized until its own declaration line runs — declaring it later
// would throw "Cannot access before initialization".
export const mockDocumentCitations: DocumentCitation[] = [
  {
    id: "cite-1",
    documentId: "doc-1",
    question: "What's the correct pagination pattern for list endpoints?",
    askedCount: 7,
    lastAskedAt: "2026-08-09T14:20:00Z",
  },
  {
    id: "cite-2",
    documentId: "doc-1",
    question: "How do we version breaking API changes?",
    askedCount: 5,
    lastAskedAt: "2026-08-06T11:05:00Z",
  },
  {
    id: "cite-3",
    documentId: "doc-2",
    question: "What's the escalation path when a Sev1 alert fires at night?",
    askedCount: 16,
    lastAskedAt: "2026-08-11T02:40:00Z",
  },
  {
    id: "cite-4",
    documentId: "doc-2",
    question: "How long do we wait before declaring an incident resolved?",
    askedCount: 11,
    lastAskedAt: "2026-08-07T16:15:00Z",
  },
  {
    id: "cite-5",
    documentId: "doc-3",
    question: "What do I need to set up on day one?",
    askedCount: 4,
    lastAskedAt: "2026-06-20T09:00:00Z",
  },
  {
    id: "cite-6",
    documentId: "doc-4",
    question: "How does the canary rollout stage work?",
    askedCount: 8,
    lastAskedAt: "2026-08-10T08:30:00Z",
  },
  {
    id: "cite-7",
    documentId: "doc-5",
    question: "How many PTO days do new hires accrue in year one?",
    askedCount: 9,
    lastAskedAt: "2026-07-30T10:00:00Z",
  },
  {
    id: "cite-8",
    documentId: "doc-5",
    question: "Can unused PTO roll over to the next year?",
    askedCount: 6,
    lastAskedAt: "2026-07-15T13:45:00Z",
  },
  {
    id: "cite-9",
    documentId: "doc-6",
    question: "What paperwork does a new hire need to complete before day one?",
    askedCount: 6,
    lastAskedAt: "2026-08-03T09:10:00Z",
  },
  {
    id: "cite-10",
    documentId: "doc-7",
    question: "What's the standard discount range for annual contracts?",
    askedCount: 12,
    lastAskedAt: "2026-08-11T15:00:00Z",
  },
  {
    id: "cite-11",
    documentId: "doc-7",
    question: "How do we price add-on seats mid-contract?",
    askedCount: 7,
    lastAskedAt: "2026-08-05T12:20:00Z",
  },
];

function countCitations(documentId: string): number {
  return mockDocumentCitations
    .filter((citation) => citation.documentId === documentId)
    .reduce((sum, citation) => sum + citation.askedCount, 0);
}

// MOCK: stand-in for `GET /spaces/:spaceId/documents`.
export const mockDocuments: DocumentSummary[] = [
  {
    id: "doc-1",
    spaceId: "engineering",
    name: "API Design Guidelines.pdf",
    fileType: "pdf",
    category: "Architecture",
    description:
      "Guidelines for designing consistent, versioned REST APIs across services.",
    status: "ready",
    updatedBy: { name: "Priya Nair", avatarInitials: "PN" },
    updatedAt: "2026-08-05T10:00:00Z",
    fileSizeBytes: 842432,
    citationCount: countCitations("doc-1"),
    visibility: "public",
    restrictedEmails: [],
  },
  {
    id: "doc-2",
    spaceId: "engineering",
    name: "Incident Response Runbook.md",
    fileType: "markdown",
    category: "Runbook",
    description:
      "Step-by-step runbook for triaging and resolving production incidents.",
    status: "ready",
    updatedBy: { name: "Alex Rivera", avatarInitials: "AR" },
    updatedAt: "2026-07-28T10:00:00Z",
    fileSizeBytes: 128540,
    citationCount: countCitations("doc-2"),
    visibility: "public",
    restrictedEmails: [],
  },
  {
    id: "doc-3",
    spaceId: "engineering",
    name: "Onboarding Checklist.docx",
    fileType: "docx",
    category: "Onboarding",
    description:
      "Checklist covering account setup and first-week tasks for new engineers.",
    status: "ready",
    updatedBy: { name: "Priya Nair", avatarInitials: "PN" },
    updatedAt: "2026-06-14T10:00:00Z",
    fileSizeBytes: 305152,
    citationCount: countCitations("doc-3"),
    visibility: "public",
    restrictedEmails: [],
  },
  {
    id: "doc-4",
    spaceId: "engineering",
    name: "Deployment Pipeline Overview.pdf",
    fileType: "pdf",
    category: "Architecture",
    description:
      "Overview of the CI/CD pipeline stages from build to production rollout.",
    status: "ready",
    updatedBy: { name: "Sam Ortiz", avatarInitials: "SO" },
    updatedAt: "2026-08-09T10:00:00Z",
    fileSizeBytes: 1887436,
    citationCount: countCitations("doc-4"),
    visibility: "restricted",
    restrictedEmails: ["sam.ortiz@company.com", "priya.nair@company.com"],
  },
  {
    id: "doc-5",
    spaceId: "hr",
    name: "Time Off Policy.pdf",
    fileType: "pdf",
    category: "Policy",
    description:
      "Company policy on paid time off accrual, requests, and rollover.",
    status: "ready",
    updatedBy: { name: "Jordan Lee", avatarInitials: "JL" },
    updatedAt: "2026-07-01T10:00:00Z",
    fileSizeBytes: 412672,
    citationCount: countCitations("doc-5"),
    visibility: "public",
    restrictedEmails: [],
  },
  {
    id: "doc-6",
    spaceId: "hr",
    name: "New Hire Onboarding.docx",
    fileType: "docx",
    category: "Onboarding",
    description:
      "Paperwork and setup steps new hires complete before their start date.",
    status: "ready",
    updatedBy: { name: "Jordan Lee", avatarInitials: "JL" },
    updatedAt: "2026-08-02T10:00:00Z",
    fileSizeBytes: 256000,
    citationCount: countCitations("doc-6"),
    visibility: "public",
    restrictedEmails: [],
  },
  {
    id: "doc-7",
    spaceId: "sales",
    name: "Pricing Playbook.pdf",
    fileType: "pdf",
    category: "Playbook",
    description:
      "Standard pricing, discount tiers, and negotiation guidance for sales.",
    status: "ready",
    updatedBy: { name: "Morgan Diaz", avatarInitials: "MD" },
    updatedAt: "2026-08-10T10:00:00Z",
    fileSizeBytes: 2202009,
    citationCount: countCitations("doc-7"),
    visibility: "public",
    restrictedEmails: [],
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
