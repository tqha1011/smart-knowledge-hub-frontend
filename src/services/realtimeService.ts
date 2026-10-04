import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { getAccessToken } from "../shared/authSession";
import type { DocumentStatusUpdatedPayload } from "../types/commonType/realtime";

const REST_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
// Socket.IO connects to the API host itself (no /api path) and appends the
// /realtime namespace, so the origin is derived from the REST base URL
// instead of introducing a second VITE_* var that could drift from it.
const SOCKET_URL = `${new URL(REST_BASE_URL).origin}/realtime`;

let socket: Socket | null = null;
let statusListeners: ((payload: DocumentStatusUpdatedPayload) => void)[] = [];

// Connects to the /realtime namespace, authenticating with the current
// access token. `auth` is a callback (not a static value) so every
// reconnect attempt — automatic retries included — reads whatever token is
// in storage at that moment, which is how a token refreshed mid-session
// reaches the socket without any manual "reconnect with new token" call.
export function connectRealtime(): void {
  if (!getAccessToken() || socket) return;

  socket = io(SOCKET_URL, {
    auth: (callback) => callback({ token: getAccessToken() }),
  });

  socket.on(
    "document.status.updated",
    (payload: DocumentStatusUpdatedPayload) => {
      statusListeners.forEach((listener) => listener(payload));
    },
  );
}

export function disconnectRealtime(): void {
  socket?.disconnect();
  socket = null;
}

// Subscribes to `document.status.updated` and returns an unsubscribe
// function. Listener storage is independent of the socket's own
// connect/disconnect lifecycle, so a component can subscribe before the
// socket connects (or across a reconnect) without losing its handler.
export function onDocumentStatusUpdated(
  listener: (payload: DocumentStatusUpdatedPayload) => void,
): () => void {
  statusListeners.push(listener);
  return () => {
    statusListeners = statusListeners.filter((l) => l !== listener);
  };
}
