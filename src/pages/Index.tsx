import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResultSurvey } from "@/components/ResultSurvey";
import { useFeedback } from "@/components/FeedbackContext";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Sparkles, FileText, FileJson, FileCode } from "lucide-react";
import type { FeedbackErrorType } from "@/lib/feedback";
import { API_BASE_URL } from "@/lib/api";
import { trackUmamiEvent, type UmamiErrorType } from "@/lib/analytics";

// YouTube URL validation regex
const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;

interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

interface ApiResponse {
  videoId: string;
  transcript: TranscriptSegment[];
}

interface TranscriptData {
  videoId: string;
  title?: string;
  transcript: string;
  segments: TranscriptSegment[];
}

const UMAMI_ERROR_TYPES = new Set<UmamiErrorType>([
  "invalid_url",
  "transcript_unavailable",
  "video_unavailable",
  "rate_limited",
  "proxy_blocked",
  "timeout",
  "network_error",
  "invalid_response",
  "upstream_error",
  "unknown",
]);

function getUmamiErrorType(errorCode: string, statusCode: number): UmamiErrorType {
  if (UMAMI_ERROR_TYPES.has(errorCode as UmamiErrorType)) return errorCode as UmamiErrorType;
  if (statusCode === 400) return "invalid_url";
  if (statusCode === 422) return "transcript_unavailable";
  if (statusCode === 429) return "rate_limited";
  if (statusCode === 504) return "timeout";
  if (statusCode >= 500) return "upstream_error";
  return "unknown";
}

function getUiErrorType(errorType: UmamiErrorType): FeedbackErrorType {
  if (errorType === "transcript_unavailable" || errorType === "video_unavailable") return "no_captions";
  if (errorType === "timeout") return "fetch_timeout";
  if (errorType === "invalid_response") return "parse_error";
  if (errorType === "proxy_blocked" || errorType === "rate_limited" || errorType === "upstream_error") {
    return "http_error";
  }
  return errorType;
}

const Index = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [downloadedVideoId, setDownloadedVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<FeedbackErrorType | null>(null);
  const { toast } = useToast();
  const { openFeedback } = useFeedback();

  const validateUrl = (url: string): boolean => {
    return YOUTUBE_URL_REGEX.test(url.trim());
  };

  const extractVideoId = (url: string): string | null => {
    try {
      const urlObj = new URL(url.trim());
      
      // Handle youtube.com/watch?v=VIDEO_ID
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      }
      
      // Handle youtu.be/VIDEO_ID
      if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }
      
      return null;
    } catch {
      // If URL parsing fails, try regex extraction
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\s&?]+)/);
      return match ? match[1] : null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorType(null);
    let requestedVideoId: string | undefined;
    let analyticsErrorType: UmamiErrorType = "unknown";
    
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      setErrorType("invalid_url");
      trackUmamiEvent({ name: "transcript_failed", data: { error_type: "invalid_url" } });
      return;
    }

    if (!validateUrl(url)) {
      setError("Please enter a valid YouTube URL");
      setErrorType("invalid_url");
      trackUmamiEvent({ name: "transcript_failed", data: { error_type: "invalid_url" } });
      return;
    }

    setIsLoading(true);
    setTranscriptData(null); // Clear previous data
    setDownloadedVideoId(null);
    let failureType: FeedbackErrorType = "unknown";
    
    try {
      // Extract video ID from URL
      const videoId = extractVideoId(url);
      requestedVideoId = videoId ?? undefined;
      
      if (!videoId) {
        analyticsErrorType = "invalid_url";
        failureType = "invalid_url";
        throw new Error("invalid_url");
      }

      // Create AbortController for timeout (30 seconds to handle 15s response time)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Call actual API endpoint
      const apiUrl = `${API_BASE_URL}/GetTranscript?videoId=${encodeURIComponent(videoId)}`;
      
      const response = await fetch(apiUrl, {
        method: "GET",
        mode: "cors", // Explicitly set CORS mode
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const errorCode = typeof errorBody?.error === "string" ? errorBody.error : "";
        analyticsErrorType = getUmamiErrorType(errorCode, response.status);
        failureType = getUiErrorType(analyticsErrorType);
        throw new Error(errorCode || "request_failed");
      }

      // Check content type
      const contentType = response.headers.get("content-type");
      
      if (!contentType || !contentType.includes("application/json")) {
        analyticsErrorType = "invalid_response";
        failureType = "parse_error";
        throw new Error("invalid_response");
      }

      // Try to parse JSON with error handling
      let data: ApiResponse;
      try {
        data = await response.json();
      } catch {
        analyticsErrorType = "invalid_response";
        failureType = "parse_error";
        throw new Error("invalid_response");
      }

      // Validate response structure
      if (!data.transcript || !Array.isArray(data.transcript)) {
        analyticsErrorType = "invalid_response";
        failureType = "parse_error";
        throw new Error("invalid_response");
      }

      if (data.transcript.length === 0) {
        analyticsErrorType = "transcript_unavailable";
        failureType = "no_captions";
        throw new Error("transcript_unavailable");
      }
      
      // Convert segments to full transcript text with proper line breaks
      const fullTranscript = data.transcript.map(segment => segment.text).join('\n');
      
      setTranscriptData({
        videoId: data.videoId,
        title: `Video ${data.videoId}`,
        transcript: fullTranscript,
        segments: data.transcript,
      });
      trackUmamiEvent({
        name: "transcript_succeeded",
        data: { video_id: requestedVideoId },
      });
      
      toast({
        title: "Success!",
        description: `Transcript fetched successfully (${data.transcript.length} segments)`,
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          analyticsErrorType = "timeout";
          failureType = "fetch_timeout";
        } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
          analyticsErrorType = "network_error";
          failureType = "network_error";
        }
      }

      trackUmamiEvent({
        name: "transcript_failed",
        data: {
          error_type: analyticsErrorType,
          ...(requestedVideoId ? { video_id: requestedVideoId } : {}),
        },
      });

      const friendlyErrors: Record<FeedbackErrorType, string> = {
        invalid_url: "Please enter a valid YouTube video link.",
        fetch_timeout: "This request took too long. Please try again.",
        network_error: "We couldn't reach the transcript service. Please try again.",
        no_captions: "Transcripts aren't available for this video. It may be private, unavailable, or have captions disabled.",
        http_error: "We couldn't fetch this transcript right now. Please try again later.",
        parse_error: "We couldn't process this transcript response. Please try again.",
        unknown: "Something went wrong while fetching this transcript. Please try again.",
      };
      setErrorType(failureType);
      const errorMessage = friendlyErrors[failureType];
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    if (!transcriptData) return;
    const filename = `${transcriptData.videoId}-transcript.txt`;
    downloadFile(transcriptData.transcript, filename, "text/plain");
    trackUmamiEvent({ name: "transcript_downloaded", data: { format: "txt", video_id: transcriptData.videoId } });
    setDownloadedVideoId(transcriptData.videoId);
    toast({ description: "Downloaded as TXT" });
  };

  const handleDownloadJson = () => {
    if (!transcriptData) return;
    // Include both full transcript and segments with timestamps
    const jsonContent = JSON.stringify({
      videoId: transcriptData.videoId,
      title: transcriptData.title,
      fullTranscript: transcriptData.transcript,
      segments: transcriptData.segments,
    }, null, 2);
    const filename = `${transcriptData.videoId}-transcript.json`;
    downloadFile(jsonContent, filename, "application/json");
    trackUmamiEvent({ name: "transcript_downloaded", data: { format: "json", video_id: transcriptData.videoId } });
    setDownloadedVideoId(transcriptData.videoId);
    toast({ description: "Downloaded as JSON" });
  };

  const handleDownloadMd = () => {
    if (!transcriptData) return;
    
    // Create markdown with timestamps
    let mdContent = `# ${transcriptData.title || "Transcript"}\n\n`;
    mdContent += `**Video ID:** ${transcriptData.videoId}\n\n`;
    mdContent += `## Full Transcript\n\n${transcriptData.transcript}\n\n`;
    mdContent += `## Transcript with Timestamps\n\n`;
    
    transcriptData.segments.forEach((segment) => {
      const timestamp = new Date(segment.start * 1000).toISOString().substr(11, 8);
      mdContent += `**[${timestamp}]** ${segment.text}\n\n`;
    });
    
    const filename = `${transcriptData.videoId}-transcript.md`;
    downloadFile(mdContent, filename, "text/markdown");
    trackUmamiEvent({ name: "transcript_downloaded", data: { format: "md", video_id: transcriptData.videoId } });
    setDownloadedVideoId(transcriptData.videoId);
    toast({ description: "Downloaded as Markdown" });
  };

  const getPreviewText = () => {
    if (!transcriptData) return "";
    const lines = transcriptData.transcript.split("\n");
    return lines.slice(0, 15).join("\n");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4 text-primary">
            <Sparkles className="w-6 h-6" />
            <span className="text-sm font-semibold tracking-wider uppercase">Powered by AI</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-glow">
            Transcript<span className="text-primary">X</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-2">
            Paste a YouTube link. Get your transcript in seconds.
          </p>
          <p className="text-sm text-muted-foreground">
            Supports TXT, JSON, and Markdown formats
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-3xl mx-auto animate-scale-in" style={{ animationDelay: "0.2s" }}>
          <div className="glass-card rounded-[24px] p-8 md:p-12 neon-border hover-glow">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter YouTube video URL..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError("");
                  }}
                  className="h-14 text-lg bg-secondary/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 focus:scale-[1.01]"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground pl-1">
                  Example: https://www.youtube.com/watch?v=XXXXXXXXXXX
                </p>
                {error && (
                    <div className="space-y-1">
                      <p className="text-sm text-destructive animate-fade-in pl-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                        {error}
                      </p>
                      <button
                        type="button"
                        className="min-h-11 pl-1 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => openFeedback({
                          source: "failure",
                          category: "something_broke",
                          errorType: errorType ?? "unknown",
                          videoUrl: url.trim(),
                        })}
                      >
                        What were you trying to do? Tell us
                      </button>
                    </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Fetching transcript...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get Transcript
                  </>
                )}
              </Button>
            </form>

            {/* Loading Details */}
            {isLoading && (
              <div className="mt-6 glass-card p-4 rounded-2xl border border-primary/30 animate-fade-in">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground mb-1">Processing your request...</p>
                    <p className="text-xs">This may take up to 15-20 seconds for longer videos</p>
                    <p className="text-xs mt-1 text-primary">💡 Tip: Check browser console (F12) for detailed logs</p>
                  </div>
                </div>
              </div>
            )}

            {/* Transcript Preview */}
            {transcriptData && (
              <div className="mt-8 space-y-6 animate-fade-in">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {transcriptData.title || "Transcript Preview"}
                  </h3>
                  <div className="glass-card p-6 rounded-2xl max-h-64 overflow-y-auto border border-border/30">
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                      {getPreviewText()}
                      {transcriptData.transcript.split("\n").length > 15 && (
                        <span className="text-primary">
                          {"\n\n"}... ({transcriptData.transcript.split("\n").length - 15} more lines)
                        </span>
                      )}
                    </pre>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground">Download as:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button
                      onClick={handleDownloadTxt}
                      variant="outline"
                      className="h-12 border-border/50 bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50 transition-all duration-300 hover:scale-105"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      TXT
                    </Button>
                    <Button
                      onClick={handleDownloadJson}
                      variant="outline"
                      className="h-12 border-border/50 bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50 transition-all duration-300 hover:scale-105"
                    >
                      <FileJson className="w-4 h-4 mr-2" />
                      JSON
                    </Button>
                    <Button
                      onClick={handleDownloadMd}
                      variant="outline"
                      className="h-12 border-border/50 bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50 transition-all duration-300 hover:scale-105"
                    >
                      <FileCode className="w-4 h-4 mr-2" />
                      Markdown
                    </Button>
                  </div>
                  <ResultSurvey
                    key={transcriptData.videoId}
                    videoId={transcriptData.videoId}
                    triggered={downloadedVideoId === transcriptData.videoId}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-20 text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <button
            type="button"
            className="min-h-11 px-3 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => openFeedback()}
          >
            Feedback
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Index;
