/**
 * Runs right after auth-config.js.
 * Optional: set window.__JB_AUTH_PATCH__ in an earlier inline script, e.g.
 *   { "storageMode":"supabase", "supabaseUrl":"...", "supabaseAnonKey":"..." }
 */
(function () {
  var base = window.JBAuthConfig;
  if (!base) return;
  var p = window.__JB_AUTH_PATCH__;
  if (!p || typeof p !== "object") return;
  if (p.storageMode) base.storageMode = p.storageMode;
  if (p.apiBaseUrl != null) base.apiBaseUrl = p.apiBaseUrl;
  if (p.supabaseUrl) base.supabaseUrl = p.supabaseUrl;
  if (p.supabaseAnonKey) base.supabaseAnonKey = p.supabaseAnonKey;
  if (p.syntheticEmailDomain) base.syntheticEmailDomain = p.syntheticEmailDomain;
})();
