# jbmanager local preview (no Python). Port 8765 — same paths as preview_server.py.
# Live reload: install Python and use preview_server.py for full /__live SSE.
param([int]$Port = 8765)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$rootFull = [System.IO.Path]::GetFullPath($root)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
try {
  $listener.Start()
} catch {
  Write-Host "Port $Port in use or URL ACL needed. Close other servers or try: netsh http add urlacl url=http://127.0.0.1:$Port/ user=$env:USERNAME"
  exit 1
}

function Get-ContentType([string]$ext) {
  switch ($ext.ToLowerInvariant()) {
    ".html" { return "text/html; charset=utf-8" }
    ".css" { return "text/css; charset=utf-8" }
    ".js" { return "application/javascript; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".png" { return "image/png" }
    ".jpg" { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".gif" { return "image/gif" }
    ".svg" { return "image/svg+xml" }
    ".ico" { return "image/x-icon" }
    ".woff2" { return "font/woff2" }
    ".woff" { return "font/woff" }
    ".webp" { return "image/webp" }
    default { return "application/octet-stream" }
  }
}

Write-Host "Login: http://127.0.0.1:$Port/login.html"
Write-Host "Index: http://127.0.0.1:$Port/index.html"
Write-Host "PREVIEW_SERVER_READY"
[Console]::Out.Flush()

$utf8 = [System.Text.Encoding]::UTF8

while ($listener.IsListening) {
  $ctx = $null
  try {
    $ctx = $listener.GetContext()
  } catch {
    break
  }
  if (-not $ctx) { continue }

  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $rawPath = $req.Url.AbsolutePath
    if ($rawPath -eq "/__live") {
      $res.StatusCode = 200
      $res.ContentType = "text/event-stream; charset=utf-8"
      $res.Headers.Add("Cache-Control", "no-store")
      $buf = $utf8.GetBytes(":ok`n`n")
      $res.ContentLength64 = $buf.LongLength
      $res.OutputStream.Write($buf, 0, $buf.Length)
      continue
    }

    $path = [System.Uri]::UnescapeDataString($rawPath)
    if ($path -eq "/" -or $path -eq "/?") {
      $path = "/login.html"
    }

    $rel = $path.TrimStart("/").Replace("/", [IO.Path]::DirectorySeparatorChar)
    if ($rel -match "\.\.") {
      $res.StatusCode = 400
      continue
    }

    $full = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($rootFull, $rel))
    if (-not $full.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
      $res.StatusCode = 403
      continue
    }

    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
      $res.StatusCode = 404
      $msg = $utf8.GetBytes("404 Not Found")
      $res.ContentLength64 = $msg.LongLength
      $res.OutputStream.Write($msg, 0, $msg.Length)
      continue
    }

    $ext = [System.IO.Path]::GetExtension($full)
    $res.StatusCode = 200
    $res.ContentType = Get-ContentType $ext
    $bytes = [System.IO.File]::ReadAllBytes($full)
    $res.ContentLength64 = $bytes.LongLength
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
  } finally {
    try { $res.Close() } catch { }
  }
}
