# -*- coding: utf-8 -*-
"""JBAppShell.init(...) 다음 코드를 .then(function(){ ... }) 로 감쌉니다."""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
pat_init = re.compile(
    r"(JBAppShell\.init\(\{[^;]+\}\));(\s*\n\s*if \(!JBAuth\.getCurrentUser\(\)\) return;)",
    re.MULTILINE,
)

for p in root.glob("*.html"):
    t = p.read_text(encoding="utf-8")
    if "JBAppShell.init" not in t or ".then(function" in t:
        continue
    m = pat_init.search(t)
    if not m:
        continue
    new_t = pat_init.sub(r"\1).then(function () {\2", t, count=1)
    # IIFE 마지막 `})();` 앞에 `});` 로 .then 닫기 — 스크립트 블록 하나만 있다고 가정
    old_close = "    })();"
    new_close = "    });\n    })();"
    if old_close in new_t and new_t.count(old_close) >= 1:
        # 첫 번째만 (같은 패턴 여러 개면 위험)
        idx = new_t.rfind("<script>")
        last_script = new_t.rfind("</script>")
        if idx == -1 or last_script == -1:
            continue
        chunk = new_t[idx:last_script]
        if chunk.count(old_close) == 1:
            new_t = new_t.replace(old_close, new_close, 1)
            p.write_text(new_t, encoding="utf-8")
            print("wrapped", p.name)
