const DEFAULT_API_BASE_URL =
  "https://transcriberapi2-hahuhgd4caayd2by.centralindia-01.azurewebsites.net/api";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, "");
