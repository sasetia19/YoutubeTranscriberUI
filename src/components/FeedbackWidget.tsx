import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FeedbackContext, type OpenFeedbackOptions } from "@/components/FeedbackContext";
import {
  submitFeedback,
  type FeedbackCategory,
} from "@/lib/feedback";
import { trackUmamiEvent } from "@/lib/analytics";

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: "something_broke", label: "Something broke" },
  { value: "something_missing", label: "Something's missing" },
  { value: "idea", label: "I have an idea" },
  { value: "other", label: "Other" },
];

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<OpenFeedbackOptions>({});

  const openFeedback = (nextOptions: OpenFeedbackOptions = {}) => {
    setOptions(nextOptions);
    setIsOpen(true);
  };

  return (
    <FeedbackContext.Provider value={{ openFeedback }}>
      {children}
      <Button
        type="button"
        variant="outline"
        onClick={() => openFeedback()}
        className="fixed bottom-3 right-3 z-40 h-11 rounded-full border-border/70 bg-background/90 px-4 text-sm text-muted-foreground shadow-lg backdrop-blur hover:border-primary/60 hover:text-foreground sm:bottom-5 sm:right-5"
        aria-haspopup="dialog"
      >
        Feedback
      </Button>
      <FeedbackDialog
        isOpen={isOpen}
        options={options}
        onClose={() => setIsOpen(false)}
      />
    </FeedbackContext.Provider>
  );
}

function FeedbackDialog({
  isOpen,
  options,
  onClose,
}: {
  isOpen: boolean;
  options: OpenFeedbackOptions;
  onClose: () => void;
}) {
  const source = options.source ?? "tab";
  const [category, setCategory] = useState<FeedbackCategory>(options.category ?? "something_broke");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [includeVideoUrl, setIncludeVideoUrl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCategory(options.category ?? "something_broke");
    setMessage("");
    setEmail("");
    setIncludeVideoUrl(false);
    setIsSubmitting(false);
    setStatus("idle");
  }, [isOpen, options]);

  useEffect(() => {
    if (status !== "success") return;
    const timeoutId = window.setTimeout(onClose, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [status, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || message.trim().length === 0) return;

    setIsSubmitting(true);
    setStatus("idle");
    try {
      await submitFeedback({
        source,
        category,
        message,
        email,
        error_type: source === "failure" ? options.errorType ?? "unknown" : undefined,
        include_video_url: includeVideoUrl,
        video_url: includeVideoUrl ? options.videoUrl : undefined,
        website: honeypotRef.current?.value ?? "",
      });
      trackUmamiEvent({ name: "feedback_submitted", data: { source } });
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto border-border/70 bg-background/95 shadow-[0_0_40px_hsl(var(--primary)/0.12)] backdrop-blur-xl sm:max-w-md">
        <DialogHeader className="pr-10 text-left">
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription className="sr-only">
            Share what you were trying to do or what did not work.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <p className="py-8 text-center text-sm font-medium text-foreground" role="status">
            Thanks, I read every message.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">What kind of feedback is this?</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Feedback category">
                {CATEGORIES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={category === item.value}
                    onClick={() => setCategory(item.value)}
                    className={`min-h-11 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      category === item.value
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Your message</Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(event) => setMessage(event.target.value.slice(0, 1000))}
                maxLength={1000}
                required
                rows={4}
                className="max-h-40 resize-y bg-secondary/40"
              />
              <p className="text-right text-xs text-muted-foreground" aria-live="polite">
                {message.length}/1000
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-email">Email (only if you want a reply)</Label>
              <Input
                id="feedback-email"
                type="email"
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value.slice(0, 254))}
                className="bg-secondary/40"
              />
            </div>

            {options.videoUrl?.trim() && (
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-muted-foreground">
                <Checkbox
                  checked={includeVideoUrl}
                  onCheckedChange={(checked) => setIncludeVideoUrl(checked === true)}
                  aria-label="Include the video link I used"
                />
                <span>Include the video link I used</span>
              </label>
            )}

            <input
              ref={honeypotRef}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[10000px] h-px w-px"
            />

            {status === "error" && (
              <p className="text-sm text-destructive" role="alert">
                Couldn't send, please try again
              </p>
            )}

            <Button type="submit" disabled={isSubmitting || !message.trim()} className="min-h-11 w-full">
              {isSubmitting ? "Sending..." : "Send feedback"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
