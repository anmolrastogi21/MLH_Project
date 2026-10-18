# ==============================================================================
# DINO GONE ROGUE — LOCAL HTTP SERVER & LAUNCHER
# ==============================================================================

$port = 8000
$url = "http://localhost:$port/"
$file = "dino-gone-rogue.html"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "             DINO GONE ROGUE -- LAUNCHER                  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Ollama Status
Write-Host "[1/3] Checking local Ollama service..." -ForegroundColor Yellow
try {
    $ollamaCheck = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 3 -ErrorAction Stop
    $modelNames = ($ollamaCheck.models | ForEach-Object { $_.name }) -join ", "
    Write-Host "  -> Ollama is RUNNING! Available models: $modelNames" -ForegroundColor Green
} catch {
    Write-Host "  -> WARNING: Ollama does not appear to be running at http://localhost:11434." -ForegroundColor Red
    Write-Host "     You can still play in Fallback Mode, or start Ollama with 'ollama serve'." -ForegroundColor Yellow
}

# 2. Start HTTP Server using .NET HttpListener
Write-Host "[2/3] Starting local HTTP server on $url..." -ForegroundColor Yellow
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
    $listener.Start()
} catch {
    Write-Host "  -> Port $port may already be in use. Trying port 8080..." -ForegroundColor Yellow
    $port = 8080
    $url = "http://localhost:$port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($url)
    $listener.Start()
}

Write-Host "  -> Server active at $url$file" -ForegroundColor Green

# 3. Open Browser
Write-Host "[3/3] Opening browser..." -ForegroundColor Yellow
$gameUrl = "$url$file"
Start-Process $gameUrl

Write-Host ""
Write-Host ">>> GAME IS LIVE! Press Ctrl+C in this window to stop the server. <<<" -ForegroundColor Cyan
Write-Host ""

$baseDir = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($baseDir)) {
    $baseDir = Get-Location
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response

        $res.Headers.Add("Access-Control-Allow-Origin", "*")
        $res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS")
        $res.Headers.Add("Access-Control-Allow-Headers", "*")

        if ($req.HttpMethod -eq "OPTIONS") {
            $res.StatusCode = 204
            $res.Close()
            continue
        }

        $localPath = $req.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($localPath) -or $localPath -eq "/") {
            $localPath = "dino-gone-rogue.html"
        }

        $fullPath = Join-Path $baseDir $localPath

        if (Test-Path $fullPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            if ($fullPath.EndsWith(".html")) {
                $res.ContentType = "text/html; charset=utf-8"
            } elseif ($fullPath.EndsWith(".js")) {
                $res.ContentType = "application/javascript"
            } elseif ($fullPath.EndsWith(".css")) {
                $res.ContentType = "text/css"
            } elseif ($fullPath.EndsWith(".json")) {
                $res.ContentType = "application/json"
            } else {
                $res.ContentType = "application/octet-stream"
            }
            $res.ContentLength64 = $bytes.Length
            $res.StatusCode = 200

            if ($req.HttpMethod -ne "HEAD") {
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } else {
            $res.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $res.ContentLength64 = $notFound.Length
            if ($req.HttpMethod -ne "HEAD") {
                $res.OutputStream.Write($notFound, 0, $notFound.Length)
            }
        }
        $res.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
