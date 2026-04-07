# -*- coding: utf-8 -*-
"""JBAppShell.init 직후 블록을 run() + waitForSession 으로 감쌉니다 (main.html 제외 이미 처리)."""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent

files = [
    "staff.html",
    "settings.html",
    "students.html",
    "student-form.html",
    "student-detail.html",
    "protective.html",
    "schedule.html",
    "payments.html",
    "notices.html",
    "notice-view.html",
    "notice-form.html",
    "consultation.html",
    "class-registry.html",
    "class-form.html",
    "class-detail.html",
    "applications.html",
]

start_pat = re.compile(
    r"(\(function \(\) \{\s*\n)(\s*)(JBAppShell\.init\(\{ activeNav: \"[^\"]+\", pageTitle: \"제이비스포츠 관리프로그램\" \}\);\s*\n)(\s*if \(!JBAuth\.getCurrentUser\(\)\) return;)",
    re.MULTILINE,
)

for name in files:
    p = root / name
    if not p.exists():
        continue
    t = p.read_text(encoding="utf-8")
    if "waitForSession().then(run)" in t:
        continue
    m = start_pat.search(t)
    if not m:
        print("skip (no match)", name)
        continue
    t2 = start_pat.sub(
        r"\1\2function run() {\n\3\4",
        t,
        count=1,
    )
    # IIFE 끝 `})();` 를 `} ... })();` 로 — 파일당 스크립트 블록 하나 가정, 마지막 `    })();` 전에 닫기
    old = "    })();\n  </script>"
    if old not in t2:
        print("skip (no close)", name)
        continue
    insert = (
        "    }\n"
        "      if (JBAuth.waitForSession) {\n"
        "        JBAuth.waitForSession().then(run);\n"
        "      } else {\n"
        "        run();\n"
        "      }\n"
        "    })();\n"
        "  </script>"
    )
    t2 = t2.replace(old, insert, 1)
    p.write_text(t2, encoding="utf-8")
    print("ok", name)
