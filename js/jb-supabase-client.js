/**
 * Supabase 브라우저 클라이언트 (UMD 번들 전역 supabase 사용)
 * auth-config.js 에서 storageMode: "supabase" 이고 URL·Anon 키가 있을 때만 생성합니다.
 */
(function (global) {
  function getConfig() {
    return global.JBAuthConfig || {};
  }

  function getClient() {
    var c = getConfig();
    if (c.storageMode !== "supabase" || !c.supabaseUrl || !c.supabaseAnonKey) {
      return null;
    }
    if (!global.supabase || typeof global.supabase.createClient !== "function") {
      console.warn("Supabase UMD 번들이 로드되지 않았습니다.");
      return null;
    }
    if (!global.__jbSupabaseClient) {
      global.__jbSupabaseClient = global.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: global.localStorage,
        },
      });
    }
    return global.__jbSupabaseClient;
  }

  global.JBSupabase = {
    getClient: getClient,
  };
})(window);
