import { API_BASE_URL } from "@/lib/api";

export type FeedbackSource = "tab" | "survey" | "failure";

export type FeedbackCategory =
  | "something_broke"
  | "something_missing"
  | "idea"
  | "other";

export type SurveyUseCase =
  | "study_notes"
  | "content_repurposing"
  | "research"
  | "translation"
  | "accessibility"
  | "other";

export type FeedbackErrorType =
  | "invalid_url"
  | "fetch_timeout"
  | "network_error"
  | "no_captions"
  | "http_error"
  | "parse_error"
  | "unknown";

export interface FeedbackSubmission {
  source: FeedbackSource;
  category?: FeedbackCategory | null;
  use_case?: SurveyUseCase | null;
  use_case_other?: string;
  helpful?: boolean | null;
  message: string;
  email?: string;
  error_type?: string | null;
  include_video_url?: boolean;
  video_url?: string;
  website?: string;
}

let sessionToken: string | null = null;

function getSessionToken() {
  if (sessionToken) return sessionToken;

  const bytes = new Uint8Array(24);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    sessionToken = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  } else {
    sessionToken = Array.from({ length: 48 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
  }
  return sessionToken;
}

export async function submitFeedback(submission: FeedbackSubmission) {
  const includeVideoUrl = submission.include_video_url === true;
  const payload = {
    ...submission,
    include_video_url: includeVideoUrl,
    video_url: includeVideoUrl ? submission.video_url : undefined,
    page_path: window.location.pathname,
    user_agent: navigator.userAgent.slice(0, 500),
    viewport_width: window.innerWidth,
    website: submission.website ?? "",
  };

  const response = await fetch(`${API_BASE_URL}/Feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Feedback-Session": getSessionToken(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Feedback submission failed");
  }
}
