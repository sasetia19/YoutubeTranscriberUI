import { createContext, useContext } from "react";
import type { FeedbackCategory, FeedbackErrorType, FeedbackSource } from "@/lib/feedback";

export interface OpenFeedbackOptions {
  source?: Exclude<FeedbackSource, "survey">;
  category?: FeedbackCategory;
  errorType?: FeedbackErrorType;
  videoUrl?: string;
}

export interface FeedbackContextValue {
  openFeedback: (options?: OpenFeedbackOptions) => void;
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback must be used inside FeedbackProvider");
  return context;
}
