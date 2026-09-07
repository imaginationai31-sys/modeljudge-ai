// ModelJudge AI frontend runtime configuration.
// Unified Render deployment: use the same-origin API proxy.
// Override window.MODELJUDGE_API_URL before this file loads if needed.
window.MODELJUDGE_API_URL = window.MODELJUDGE_API_URL || "/api";

// Dashboard-only buyer release controls. Buyer credentials are never embedded
// in the frontend; dataset downloads remain protected by dataset:read scope.
if (/\/dashboard(?:\.html)?$/i.test(window.location.pathname)) {
  ["release-download.js?v=20260908", "release-quality.js?v=20260908"].forEach((src) => {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  });
}
