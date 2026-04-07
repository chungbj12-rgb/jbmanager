# -*- coding: utf-8 -*-
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
old = """  <script src=\"auth-config.js\"></script>
  <script src=\"app-preferences.js\"></script>"""
new = """  <script src=\"auth-config.js\"></script>
  <script src=\"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/dist/umd/supabase.js\"></script>
  <script src=\"js/jb-supabase-client.js\"></script>
  <script src=\"js/jb-remote-sync.js\"></script>
  <script src=\"app-preferences.js\"></script>"""
for p in root.glob("*.html"):
    t = p.read_text(encoding="utf-8")
    if old in t:
        p.write_text(t.replace(old, new, 1), encoding="utf-8")
        print("patched", p.name)
