// ModelJudge AI frontend runtime configuration.
// Unified Render deployment: use the same-origin API proxy.
// Override window.MODELJUDGE_API_URL before this file loads if needed.
window.MODELJUDGE_API_URL = window.MODELJUDGE_API_URL || "/api";

// Dashboard-only buyer release control. The download itself remains protected by
// the buyer API key and dataset:read scope; no key is embedded in the frontend.
if (/\/dashboard(?:\.html)?$/i.test(window.location.pathname)) {
  const script = document.createElement("script");
  script.src = "release-download.js?v=20260908";
  script.defer = true;
  document.head.appendChild(script);
}
