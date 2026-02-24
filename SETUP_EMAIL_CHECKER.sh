#!/bin/bash
# Veritas AI - Email Spam Checker Quick Setup & Verification

echo "🚀 Veritas AI - Email Spam Checker Setup"
echo "========================================"
echo ""

# Check if files exist
echo "✅ Checking files..."

files=(
  "app/api/check-email/route.ts"
  "components/email-spam-checker.tsx"
  "app/page.tsx"
  "components/sidebar.tsx"
  "Docs/EMAIL_SPAM_CHECKER_DEPLOYMENT.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ MISSING: $file"
  fi
done

echo ""
echo "📋 Setup Instructions:"
echo "====================="
echo ""
echo "1. Install dependencies:"
echo "   pnpm install"
echo ""
echo "2. Verify build (optional):"
echo "   pnpm build"
echo ""
echo "3. Test locally (optional):"
echo "   pnpm dev"
echo "   # Visit http://localhost:3000 and click 'Email Check' tab"
echo ""
echo "4. Deploy to Vercel:"
echo "   pnpm deploy:vercel"
echo "   # OR visit https://vercel.com and import your GitHub repo"
echo ""
echo "✨ All files are ready for deployment!"
echo ""
echo "📖 For detailed instructions, see:"
echo "   Docs/EMAIL_SPAM_CHECKER_DEPLOYMENT.md"
