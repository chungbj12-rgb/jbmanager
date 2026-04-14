/**
 * 인증·저장소
 * - storageMode "local": browser localStorage + Web Crypto (PBKDF2)
 * - storageMode "supabase": Supabase Auth + Postgres(app_kv 등)
 */
window.JBAuthConfig = {
  storageMode: "supabase",
  apiBaseUrl: "",
  supabaseUrl: "https://uacejzqynutnpnddlbcx.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhY2VqenF5bnV0bnBuZGRsYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NjkxMjEsImV4cCI6MjA5MTA0NTEyMX0.htmVaYfT9F_6iXLrpoRTTLmVDdpuhAWHisTBBmCLiFI",
  syntheticEmailDomain: "jbphonelogin.local",
};
