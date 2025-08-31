#!/bin/bash

echo "🚀 Astro Oracle Backend - Render Deployment Helper"
echo "=================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: This directory is not a git repository."
    echo "Please initialize git and push your code to GitHub first."
    exit 1
fi

# Check if required files exist
echo "📋 Checking required files..."

required_files=("render.yaml" "Dockerfile" ".dockerignore" "server/package.json" "server/server.js")

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        missing_files=true
    fi
done

if [ "$missing_files" = true ]; then
    echo ""
    echo "❌ Some required files are missing. Please ensure all files are present before deploying."
    exit 1
fi

echo ""
echo "✅ All required files are present!"
echo ""

# Check if environment variables are documented
echo "🔧 Environment Variables Checklist:"
echo "===================================="
echo "Make sure you have the following environment variables ready:"
echo ""
echo "Required:"
echo "  - OPENAI_API_KEY"
echo "  - PROKERALA_API_KEY" 
echo "  - PROKERALA_CLIENT_SECRET"
echo "  - FRONTEND_URL (your Vercel frontend URL)"
echo ""
echo "Optional (have defaults):"
echo "  - NODE_ENV (default: production)"
echo "  - PORT (Render sets automatically)"
echo "  - CHROMA_HOST (default: localhost)"
echo "  - CHROMA_PORT (default: 8000)"
echo ""

# Deployment instructions
echo "📝 Deployment Steps:"
echo "===================="
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Add Render deployment configuration'"
echo "   git push origin main"
echo ""
echo "2. Go to Render Dashboard:"
echo "   https://dashboard.render.com"
echo ""
echo "3. Create new Blueprint service:"
echo "   - Click 'New +' → 'Blueprint'"
echo "   - Connect your GitHub repository"
echo "   - Render will detect render.yaml automatically"
echo ""
echo "4. Configure environment variables in Render dashboard"
echo ""
echo "5. Deploy and test!"
echo ""

# Check if code is committed
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes."
    echo "   Consider committing your changes before deploying:"
    echo "   git add . && git commit -m 'Update deployment config'"
    echo ""
fi

echo "🎉 Ready to deploy to Render!"
echo ""
echo "For detailed instructions, see: RENDER_DEPLOYMENT.md"
