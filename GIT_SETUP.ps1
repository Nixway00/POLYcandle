# PolyCandle - Git Repository Setup Script
# Run this in PowerShell from the project root

Write-Host "PolyCandle - Git Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists and warn
if (Test-Path ".env") {
    Write-Host "WARNING: Found .env file - verifying it's in .gitignore..." -ForegroundColor Yellow
    $gitignoreContent = Get-Content .gitignore -Raw
    if ($gitignoreContent -match "\.env") {
        Write-Host "OK: .env is properly ignored" -ForegroundColor Green
    } else {
        Write-Host "ERROR: .env is NOT in .gitignore!" -ForegroundColor Red
        Write-Host "Please add .env to .gitignore before continuing" -ForegroundColor Red
        exit 1
    }
}

# Initialize Git if not already done
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "Git initialized" -ForegroundColor Green
} else {
    Write-Host "Git already initialized" -ForegroundColor Green
}

# Check git status
Write-Host ""
Write-Host "Current Git Status:" -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "Verifying sensitive files are NOT staged..." -ForegroundColor Yellow

$status = git status --short
if ($status -match "\.env") {
    Write-Host "ERROR: .env file is being tracked!" -ForegroundColor Red
    Write-Host "Removing .env from Git..." -ForegroundColor Yellow
    git rm --cached .env
    Write-Host ".env removed from staging" -ForegroundColor Green
}

# Add all files
Write-Host ""
Write-Host "Adding files to Git..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "Files staged for commit" -ForegroundColor Green

# Show what will be committed
Write-Host ""
Write-Host "Files to be committed:" -ForegroundColor Cyan
git status --short

# Create commit
Write-Host ""
Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: PolyCandle MVP

Features:
- Multi-asset betting (BTC, ETH, SOL, ZEC)
- Pari-mutuel betting model with 5% platform fee
- Real-time countdown and live multipliers
- TradingView chart integration
- Round lifecycle management (OPEN -> LOCKED -> SETTLED)
- PostgreSQL + Prisma ORM
- Next.js 14 with App Router
- TypeScript throughout

MVP is fully functional with mock price feed.
Ready for payment integration and production deployment."

Write-Host "Commit created!" -ForegroundColor Green

# Rename branch to main if needed
Write-Host ""
Write-Host "Setting branch to 'main'..." -ForegroundColor Yellow
git branch -M main
Write-Host "Branch set to main" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Local Git setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a new repository on GitHub:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Name it: polycandle" -ForegroundColor White
Write-Host "3. Make it: Public" -ForegroundColor White
Write-Host "4. Do NOT initialize with README" -ForegroundColor White
Write-Host ""
Write-Host "5. Then run these commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   git remote add origin https://github.com/Nixway00/POLYcandle.git" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
