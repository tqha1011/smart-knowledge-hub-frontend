// Payload of the `document.status.updated` event pushed over the
// `/realtime` Socket.IO namespace once a document finishes (or fails)
// ingestion. Server auto-joins each socket to `ks:<knowledgeSpacePublicId>`
// rooms at connect time, so a listener only ever receives events for
// Spaces the current user belongs to.
export interface DocumentStatusUpdatedPayload {
  documentPublicId: string;
  knowledgeSpacePublicId: string;
  fileName: string;
  status: "Ready" | "Failed";
  updatedAt: string;
}
