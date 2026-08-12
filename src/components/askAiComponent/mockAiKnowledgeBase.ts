import { mockDocuments, mockSpaces } from "../shell/shellMockData";
import type { AskAiCitation, AssistantAnswer } from "../../types";

interface AiAnswerEntry {
  keywords: string[];
  answerText: string;
  documentIds: string[];
}

// MOCK: stands in for a real RAG backend. Keyword-matches a question
// against a small canned knowledge base and cites real mockDocuments
// entries — deliberately does not mutate mockDocumentCitations'
// citationCount (see the plan's Architecture note): citing real document
// IDs already demonstrates the spec's "same underlying citation-tracking
// data" relationship without inflating a count that no backend tracks.
const mockAiAnswers: AiAnswerEntry[] = [
  {
    keywords: ["pagination", "api version", "breaking change", "versioning"],
    answerText:
      "For list endpoints, use cursor-based pagination with a next_cursor token rather than offset/limit — it stays stable as records are inserted or removed {{1}}. When introducing a breaking API change, ship it behind a new version prefix (e.g. /v2/) rather than mutating the existing contract, and give consumers a documented deprecation window {{1}}.",
    documentIds: ["doc-1"],
  },
  {
    keywords: [
      "incident",
      "escalation",
      "sev1",
      "outage",
      "on-call",
      "rollback",
    ],
    answerText:
      "If a Sev1 alert fires, page the on-call engineer first and open an incident channel within 5 minutes {{1}}. Don't declare an incident resolved until the error rate has stayed below threshold for a full monitoring window, not just the moment metrics first dip back down {{1}}.",
    documentIds: ["doc-2"],
  },
  {
    keywords: ["pto", "time off", "vacation", "leave", "rollover"],
    answerText:
      "New hires accrue PTO starting their first pay period, and up to 5 unused days can roll over into the next calendar year — anything beyond that is forfeited {{1}}.",
    documentIds: ["doc-5"],
  },
  {
    keywords: ["discount", "pricing", "contract", "annual", "multi-year"],
    answerText:
      "Standard annual contracts support up to a 15% discount without approval; anything deeper needs sales-leadership sign-off {{1}}. Add-on seats added mid-contract are prorated at the same per-seat rate as the original agreement {{1}}.",
    documentIds: ["doc-7"],
  },
];

// Returns a low-confidence AssistantAnswer (empty citations) when no
// keyword matches, OR when every cited document falls outside the
// accessible Space list — the caller (AskAiPanel) is responsible for
// logging a knowledge gap whenever isLowConfidence is true.
export function findAnswer(
  question: string,
  accessibleSpaceIds: string[],
  currentSpaceName: string,
): AssistantAnswer {
  const lowerQuestion = question.toLowerCase();
  const matchedEntry = mockAiAnswers.find((entry) =>
    entry.keywords.some((keyword) => lowerQuestion.includes(keyword)),
  );

  if (matchedEntry) {
    const citations: AskAiCitation[] = matchedEntry.documentIds
      .map((documentId, index) => {
        const document = mockDocuments.find((doc) => doc.id === documentId);
        if (!document || !accessibleSpaceIds.includes(document.spaceId)) {
          return null;
        }
        const space = mockSpaces.find((s) => s.id === document.spaceId);
        return {
          chipNumber: index + 1,
          documentId: document.id,
          documentTitle: document.name,
          spaceId: document.spaceId,
          spaceName: space?.name ?? document.spaceId,
        };
      })
      .filter((citation): citation is AskAiCitation => citation !== null);

    if (citations.length > 0) {
      return {
        text: matchedEntry.answerText,
        citations,
        isLowConfidence: false,
      };
    }
  }

  return {
    text: `I don't have a confident source for that yet — I've logged it to ${currentSpaceName}'s Needs attention queue so an editor can add coverage.`,
    citations: [],
    isLowConfidence: true,
  };
}
