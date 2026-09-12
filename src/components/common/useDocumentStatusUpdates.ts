import { useEffect, useRef } from "react";
import { onDocumentStatusUpdated } from "../../services/realtimeService";
import type { DocumentStatusUpdatedPayload } from "../../types/commonType/realtime";

// Subscribes a component to realtime `document.status.updated` events for
// as long as it's mounted. `onUpdate` is read through a ref so callers can
// pass an inline function without retriggering the subscribe/unsubscribe
// effect on every render.
export function useDocumentStatusUpdates(
  onUpdate: (payload: DocumentStatusUpdatedPayload) => void,
): void {
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    return onDocumentStatusUpdated((payload) => onUpdateRef.current(payload));
  }, []);
}
