import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Sparkles, FileText, FileJson, FileCode } from "lucide-react";

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

const Index = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

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
    
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    if (!validateUrl(url)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setIsLoading(true);
    setTranscriptData(null); // Clear previous data
    
    try {
      // Extract video ID from URL
      const videoId = extractVideoId(url);
      
      if (!videoId) {
        throw new Error("Could not extract video ID from URL");
      }

      console.log("Fetching transcript for video ID:", videoId);

      // Create AbortController for timeout (30 seconds to handle 15s response time)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Call actual API endpoint
      const apiUrl = `https://transcriberapi2-hahuhgd4caayd2by.centralindia-01.azurewebsites.net/api/GetTranscript?videoId=${videoId}`;
      
      console.log("API URL:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "GET",
        mode: "cors", // Explicitly set CORS mode
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unable to read error");
        console.error("API Error Response:", errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);
      
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error("Non-JSON response received:", responseText.substring(0, 500));
        throw new Error(`Expected JSON response, got: ${contentType || 'unknown'}`);
      }

      // Try to parse JSON with error handling
      let data: ApiResponse;
      const responseText = await response.text();
      console.log("Response size:", responseText.length, "characters");
      
      try {
        data = JSON.parse(responseText);
        console.log("Parsed transcript segments:", data.transcript?.length || 0);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Response preview:", responseText.substring(0, 1000));
        throw new Error("Failed to parse API response. The response may be malformed.");
      }

      // Validate response structure
      if (!data.transcript || !Array.isArray(data.transcript)) {
        console.error("Invalid response structure:", data);
        throw new Error("Invalid response format: transcript array not found");
      }

      if (data.transcript.length === 0) {
        throw new Error("No transcript available for this video. It may not have captions.");
      }
      
      // Convert segments to full transcript text with proper line breaks
      const fullTranscript = data.transcript.map(segment => segment.text).join('\n');
      
      console.log("Full transcript length:", fullTranscript.length, "characters");
      console.log("Total segments:", data.transcript.length);
      
      setTranscriptData({
        videoId: data.videoId,
        title: `Video ${data.videoId}`,
        transcript: fullTranscript,
        segments: data.transcript,
      });
      
      toast({
        title: "Success!",
        description: `Transcript fetched successfully (${data.transcript.length} segments)`,
      });
    } catch (err) {
      console.error("Error fetching transcript:", err);
      
      let errorMessage = "Failed to fetch transcript. Please try again.";
      let errorDetails = "";
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = "Request timed out. The video may be too long or the server is busy.";
          errorDetails = "Try a shorter video or wait a moment and retry.";
        } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
          errorMessage = "Network error or CORS issue detected.";
          errorDetails = "The API may be blocking requests from this domain. Check browser console for CORS errors.";
        } else if (err.message.includes('JSON')) {
          errorMessage = "Failed to parse API response.";
          errorDetails = err.message;
        } else {
          errorMessage = err.message;
          errorDetails = "Check browser console (F12) for detailed error logs.";
        }
      }
      
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorDetails || errorMessage,
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
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4 text-primary">
            <Sparkles className="w-6 h-6" />
            <span className="text-sm font-semibold tracking-wider uppercase">Powered by AI</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-glow">
            Transcript<span className="text-primary">X</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-2">
            Paste a YouTube link. Download clean transcripts in seconds.
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
                  <p className="text-sm text-destructive animate-fade-in pl-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                    {error}
                  </p>
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
                </div>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground glass-card inline-block px-6 py-3 rounded-full border border-border/30">
              🔒 We only use your link to fetch the transcript. No data is stored after you close the page.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <p>Built with ❤️ using modern web technologies</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
