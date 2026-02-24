# Vercel Deployment Scripts

# Deploy to production
$env:GOOGLE_GENERATIVE_AI_API_KEY = "your_api_key_here"
Write-Host "Deploying to Vercel..." -ForegroundColor Green
vercel --prod

# Deploy to preview
function Deploy-Preview {
    Write-Host "Deploying preview to Vercel..." -ForegroundColor Yellow
    vercel
}

# View deployment logs
function Show-Logs {
    Write-Host "Fetching Vercel logs..." -ForegroundColor Blue
    vercel logs
}

# Check deployment status
function Check-Status {
    Write-Host "Checking Vercel deployment status..." -ForegroundColor Cyan
    vercel ls
}

Write-Host "Vercel deployment scripts loaded!" -ForegroundColor Green
Write-Host "Available commands:" -ForegroundColor White
Write-Host "  - Deploy-Preview: Deploy to preview environment" -ForegroundColor Gray
Write-Host "  - Show-Logs: View deployment logs" -ForegroundColor Gray
Write-Host "  - Check-Status: Check deployment status" -ForegroundColor Gray
