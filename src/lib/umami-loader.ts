const ALLOWED_HOSTNAMES = new Set(["transcriptsx.com", "www.transcriptsx.com"]);
const bootstrap = document.querySelector<HTMLScriptElement>("script[data-umami-bootstrap]");
const websiteId = bootstrap?.dataset.websiteId;

if (
  ALLOWED_HOSTNAMES.has(window.location.hostname) &&
  websiteId &&
  !websiteId.includes("%")
) {
  const tracker = document.createElement("script");
  tracker.defer = true;
  tracker.src = "https://cloud.umami.is/script.js";
  tracker.dataset.websiteId = websiteId;
  tracker.dataset.domains = "transcriptsx.com,www.transcriptsx.com";
  tracker.dataset.excludeSearch = "true";
  tracker.addEventListener(
    "load",
    () => window.dispatchEvent(new Event("transcriptx:umami-ready")),
    { once: true },
  );
  document.head.appendChild(tracker);
}
