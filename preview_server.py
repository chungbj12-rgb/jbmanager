"""
로컬 미리보기: 루트의 .html / .css / .js 변경 시 SSE로 클라이언트 새로고침.
사용: python preview_server.py
      python preview_server.py --open   # 브라우저에서 index 열기
"""
from __future__ import annotations

import argparse
import http.server
import os
import socketserver
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = 8765

_lock = threading.Lock()
_clients: list[threading.Event] = []


def _root_mtimes() -> dict[str, float]:
    out: dict[str, float] = {}
    if not ROOT.is_dir():
        return out
    for p in ROOT.iterdir():
        if p.is_file() and p.suffix.lower() in {".html", ".css", ".js"}:
            out[p.name] = p.stat().st_mtime
    return out


def watcher_loop() -> None:
    last = _root_mtimes()
    while True:
        time.sleep(0.35)
        cur = _root_mtimes()
        if cur != last:
            last = cur
            with _lock:
                for ev in _clients:
                    ev.set()


threading.Thread(target=watcher_loop, daemon=True).start()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format: str, *args) -> None:
        return

    def do_GET(self) -> None:  # noqa: N802
        if self.path.split("?", 1)[0] == "/__live":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Connection", "keep-alive")
            self.end_headers()

            ev = threading.Event()
            with _lock:
                _clients.append(ev)

            try:
                self.wfile.write(b":ok\n\n")
                self.wfile.flush()
                while True:
                    if ev.wait(timeout=30):
                        ev.clear()
                        self.wfile.write(b"data: reload\n\n")
                        self.wfile.flush()
                    else:
                        self.wfile.write(b": ping\n\n")
                        self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError, OSError):
                pass
            finally:
                with _lock:
                    if ev in _clients:
                        _clients.remove(ev)
            return

        if self.path in ("/", "/?"):
            self.path = "/index.html"
        super().do_GET()


def main() -> None:
    parser = argparse.ArgumentParser(description="Static preview + live reload")
    parser.add_argument(
        "--open",
        action="store_true",
        help="Open http://127.0.0.1:%s/index.html in default browser" % PORT,
    )
    args = parser.parse_args()

    os.chdir(ROOT)
    if args.open:

        def _open_browser() -> None:
            webbrowser.open(f"http://127.0.0.1:{PORT}/index.html")

        threading.Timer(0.7, _open_browser).start()

    with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:
        httpd.allow_reuse_address = True
        print(f"미리보기: http://127.0.0.1:{PORT}/index.html")
        print(f"스튜디오: http://127.0.0.1:{PORT}/studio.html")
        print("PREVIEW_SERVER_READY", flush=True)
        print("중지: Ctrl+C")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print()


if __name__ == "__main__":
    main()
