/* preview_server.py + http://127.0.0.1:8765 에서만 동작 — 파일 저장 시 전체 새로고침 */
(function () {
  var h = location.hostname;
  if (h !== "127.0.0.1" && h !== "localhost") return;
  var es = new EventSource("/__live");
  es.onmessage = function () {
    location.reload();
  };
  es.onerror = function () {
    es.close();
  };
})();
