/**
 * 이 파일을 복사해 auth-config.js 로 저장한 뒤 값을 채우세요.
 * auth-config.js 는 민감한 키가 들어가므로 Git 에 올리지 마세요 (.gitignore 권장).
 */
window.JBAuthConfig = {
  /** "local" | "supabase" */
  storageMode: "local",

  /** (미사용) 예비 API 베이스 URL */
  apiBaseUrl: "",

  /** Supabase 프로젝트 URL (예: https://xxxx.supabase.co) */
  supabaseUrl: "",

  /** Supabase → Settings → API → anon public key */
  supabaseAnonKey: "",

  /**
   * 전화번호 로그인을 Supabase Auth 이메일로 쓸 때 도메인.
   * 형식: u01012345678@<syntheticEmailDomain>
   * 가입 시 이메일 형식 검증에 맞는 도메인을 쓰세요.
   */
  syntheticEmailDomain: "jbphonelogin.local",
};
