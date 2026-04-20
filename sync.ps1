# ═══════════════════════════════════════════════════════════════
# mjrifat.com — one-click sync
#
# Run:  .\sync.ps1  (or double-click sync.bat)
#
# Does in order:
#   1. Pull --rebase from origin/main (so push can't be rejected)
#   2. Run python _build_subpages.py (regenerates 20+ subpages)
#   3. Stage all changes, commit with a timestamp or your message
#   4. Push to GitHub → Pages auto-deploys to https://mjrifat.com
# ═══════════════════════════════════════════════════════════════

Set-Location $PSScriptRoot

function Step($msg) {
    Write-Host ""
    Write-Host "──── $msg ────" -ForegroundColor Cyan
}

function Die($msg) {
    Write-Host ""
    Write-Host "  ✗  $msg" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to close"
    exit 1
}

# ---- 1. Pull with rebase so push can't be rejected -----------------------
Step "1/4  Pulling latest from origin/main"
git pull --rebase origin main
if ($LASTEXITCODE -ne 0) {
    Die "Pull/rebase failed. Resolve conflicts manually, then 'git rebase --continue' + run sync again."
}

# ---- 2. Regenerate subpages if the builder or any source file changed ----
Step "2/4  Regenerating subpages"
if (Test-Path "_build_subpages.py") {
    python _build_subpages.py
    if ($LASTEXITCODE -ne 0) { Die "_build_subpages.py crashed. Fix the Python error, run sync again." }
} else {
    Write-Host "  (no _build_subpages.py found — skipping)" -ForegroundColor DarkGray
}

# ---- 3. Stage + commit ---------------------------------------------------
Step "3/4  Staging changes"
git add -A

$status = git status --porcelain
if (-not $status) {
    Write-Host "  Nothing to commit — working tree already clean." -ForegroundColor Green
    Step "4/4  Pushing any local commits ahead of remote"
    git push
    Write-Host ""
    Write-Host "  ✓ Done. Site live at https://mjrifat.com" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to close"
    exit 0
}

Write-Host ""
Write-Host "  Files to commit:" -ForegroundColor Yellow
git status --short

Write-Host ""
$msg = Read-Host "  Commit message (Enter for auto-timestamp)"
if ([string]::IsNullOrWhiteSpace($msg)) {
    $msg = "sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    Write-Host "  → using: $msg" -ForegroundColor DarkGray
}

git commit -m $msg
if ($LASTEXITCODE -ne 0) { Die "Commit failed — see output above." }

# ---- 4. Push -------------------------------------------------------------
Step "4/4  Pushing to GitHub"
git push
if ($LASTEXITCODE -ne 0) { Die "Push failed — see output above." }

Write-Host ""
Write-Host "  ✓ Pushed. Site will be live in ~60 seconds at https://mjrifat.com" -ForegroundColor Green
Write-Host "  ✓ Check build status: https://github.com/MuraduzzamanRifat/mj/actions" -ForegroundColor DarkGray
Write-Host ""
Read-Host "Press Enter to close"
