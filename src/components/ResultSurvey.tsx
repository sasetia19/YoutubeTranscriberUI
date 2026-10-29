import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitFeedback, type SurveyUseCase } from "@/lib/feedback";
import { trackUmamiEvent } from "@/lib/analytics";

const COOLDOWN_KEY = "transcriptx-feedback-survey-last-shown";
const TRANSCRIPT_KEY_PREFIX = "transcriptx-feedback-survey-done:";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const USE_CASES: { value: SurveyUseCase; label: string }[] = [
  { value: "study_notes", label: "Study notes" },
  { value: "content_repurposing", label: "Content/repurposing" },
  { value: "research", label: "Research" },
  { value: "translation", label: "Translation" },
  { value: "accessibility", label: "Accessibility" },
  { value: "other", label: "Other" },
];

function storageGet(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

export function ResultSurvey({ videoId, triggered }: { videoId: string; triggered: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [useCase, setUseCase] = useState<SurveyUseCase | null>(null);
  const [otherUseCase, setOtherUseCase] = useState("");
  const [skippedUseCase, setSkippedUseCase] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [missing, setMissing] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (!triggered || isVisible || isDismissed) return;
    if (storageGet(`${TRANSCRIPT_KEY_PREFIX}${videoId}`)) {
      setIsDismissed(true);
      return;
    }

    const lastShown = Number(storageGet(COOLDOWN_KEY) || 0);
    if (lastShown && Date.now() - lastShown < COOLDOWN_MS) {
      setIsDismissed(true);
      return;
    }

    storageSet(COOLDOWN_KEY, String(Date.now()));
    setIsVisible(true);
  }, [triggered, videoId, isVisible, isDismissed]);

  useEffect(() => {
    if (status !== "success") return;
    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
      setIsDismissed(true);
    }, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [status]);

  const dismiss = () => {
    storageSet(`${TRANSCRIPT_KEY_PREFIX}${videoId}`, "1");
    setIsVisible(false);
    setIsDismissed(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (helpful === null || isSubmitting) return;

    setIsSubmitting(true);
    setStatus("idle");
    try {
      await submitFeedback({
        source: "survey",
        message: helpful ? "" : missing,
        use_case: useCase,
        use_case_other: useCase === "other" ? otherUseCase : undefined,
        helpful,
      });
      trackUmamiEvent({ name: "feedback_submitted", data: { source: "survey" } });
      storageSet(`${TRANSCRIPT_KEY_PREFIX}${videoId}`, "1");
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible || isDismissed) return null;

  if (status === "success") {
    return (
      <p className="border-t border-border/50 pt-3 text-sm text-muted-foreground" role="status">
        Thanks for the feedback.
      </p>
    );
  }

  const showHelpfulQuestion = useCase !== null || skippedUseCase;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-border/50 pt-4">
      <section className="space-y-2">
        <p className="text-sm font-medium">What are you using this for?</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Transcript use case">
          {USE_CASES.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={useCase === item.value}
              onClick={() => {
                setUseCase(item.value);
                setSkippedUseCase(false);
              }}
              className={`min-h-11 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                useCase === item.value
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {useCase === "other" && (
          <div className="space-y-1">
            <Label htmlFor={`survey-other-${videoId}`}>What are you using it for?</Label>
            <Input
              id={`survey-other-${videoId}`}
              value={otherUseCase}
              onChange={(event) => setOtherUseCase(event.target.value.slice(0, 200))}
              maxLength={200}
              className="h-11 bg-secondary/40"
            />
          </div>
        )}
        {!showHelpfulQuestion && (
          <Button
            type="button"
            variant="link"
            className="h-11 px-1 text-muted-foreground"
            onClick={() => setSkippedUseCase(true)}
          >
            Skip this question
          </Button>
        )}
      </section>

      {showHelpfulQuestion && (
        <section className="space-y-2">
          <p className="text-sm font-medium">Did you get what you needed?</p>
          <div className="flex gap-2" role="group" aria-label="Was this transcript helpful?">
            <Button
              type="button"
              variant={helpful === true ? "secondary" : "outline"}
              className="h-11 min-w-11 text-lg"
              aria-label="Yes, I got what I needed"
              aria-pressed={helpful === true}
              onClick={() => setHelpful(true)}
            >
              👍
            </Button>
            <Button
              type="button"
              variant={helpful === false ? "secondary" : "outline"}
              className="h-11 min-w-11 text-lg"
              aria-label="No, I did not get what I needed"
              aria-pressed={helpful === false}
              onClick={() => setHelpful(false)}
            >
              👎
            </Button>
          </div>
          {helpful === false && (
            <div className="space-y-1">
              <Label htmlFor={`survey-missing-${videoId}`}>What was missing?</Label>
              <Input
                id={`survey-missing-${videoId}`}
                value={missing}
                onChange={(event) => setMissing(event.target.value.slice(0, 1000))}
                maxLength={1000}
                className="h-11 bg-secondary/40"
              />
            </div>
          )}
        </section>
      )}

      {status === "error" && (
        <p className="text-sm text-destructive" role="alert">
          Couldn't send, please try again
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="link" className="h-11 px-1 text-muted-foreground" onClick={dismiss}>
          Skip survey
        </Button>
        {helpful !== null && (
          <Button type="submit" disabled={isSubmitting} className="min-h-11">
            {isSubmitting ? "Sending..." : "Send answer"}
          </Button>
        )}
      </div>
    </form>
  );
}
