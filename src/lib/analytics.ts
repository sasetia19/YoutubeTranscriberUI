export type UmamiErrorType =
  | "invalid_url"
  | "transcript_unavailable"
  | "video_unavailable"
  | "rate_limited"
  | "proxy_blocked"
  | "timeout"
  | "network_error"
  | "invalid_response"
  | "upstream_error"
  | "unknown";

export type TranscriptEvent =
  | { name: "transcript_succeeded"; data: { video_id: string } }
  | { name: "transcript_failed"; data: { error_type: UmamiErrorType; video_id?: string } }
  | { name: "transcript_downloaded"; data: { format: "txt" | "json" | "md"; video_id: string } }
  | { name: "feedback_submitted"; data: { source: "tab" | "survey" | "failure" } };

type UmamiEvent = TranscriptEvent["name"];
type UmamiProperties = TranscriptEvent["data"];

const ALLOWED_HOSTNAMES = new Set(["transcriptsx.com", "www.transcriptsx.com"]);
const queuedEvents: TranscriptEvent[] = [];
const MAX_QUEUED_EVENTS = 50;

interface UmamiTracker {
  track: (name: UmamiEvent, properties?: UmamiProperties) => unknown;
}

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

function isProductionHostname() {
  return typeof window !== "undefined" && ALLOWED_HOSTNAMES.has(window.location.hostname);
}

function sendEvent({ name, data }: TranscriptEvent) {
  try {
    const result = window.umami?.track(name, data);
    if (result && typeof (result as Promise<unknown>).catch === "function") {
      void (result as Promise<unknown>).catch(() => undefined);
    }
  } catch {
    return;
  }
}

function flushQueuedEvents() {
  if (!isProductionHostname() || !window.umami) return;
  for (const event of queuedEvents.splice(0)) sendEvent(event);
}

if (typeof window !== "undefined") {
  window.addEventListener("transcriptx:umami-ready", flushQueuedEvents);
}

export function trackUmamiEvent(event: TranscriptEvent) {
  try {
    if (!isProductionHostname()) return;
    if (window.umami) {
      sendEvent(event);
      return;
    }
    if (queuedEvents.length < MAX_QUEUED_EVENTS) queuedEvents.push(event);
  } catch {
    return;
  }
}
