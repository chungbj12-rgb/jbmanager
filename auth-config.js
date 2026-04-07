/**
 * 인증·저장소
 * - storageMode "local": 브라우저 localStorage + Web Crypto(PBKDF2)
 * - storageMode "supabase": Supabase Auth + Postgres(app_kv 등). Vercel 배포 시 사용.
 */
window.JBAuthConfig = {
  storageMode: "local",
  apiBaseUrl: "",
  supabaseUrl: "",
  supabaseAnonKey: "",
  syntheticEmailDomain: "jbphonelogin.local",
};
