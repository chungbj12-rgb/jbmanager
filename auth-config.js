/**
 * 인증·저장소 동작 스위치 (배포 전 검토)
 * - storageMode 'local': 브라우저 localStorage + Web Crypto(PBKDF2). 도메인·브라우저마다 데이터가 분리됩니다.
 * - storageMode 'api': 서버 API 사용 예정 — 아래 엔드포인트에 맞춰 auth.js를 확장하면 됩니다.
 */
window.JBAuthConfig = {
  storageMode: "local",
  apiBaseUrl: "",
};
