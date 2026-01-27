#!/bin/bash

# Local Development Setup Script
# Run this script to set up local development environment

set -e

echo "🚀 Setting up n8n MCP SaaS local development environment..."

# Check if wrangler is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first."
    exit 1
fi

# Create .dev.vars if it doesn't exist
if [ ! -f ".dev.vars" ]; then
    echo "📝 Creating .dev.vars from example..."
    cp .dev.vars.example .dev.vars
    echo "✅ Created .dev.vars - you can customize the values if needed"
else
    echo "✅ .dev.vars already exists"
fi

# Create local D1 database
echo "📦 Setting up local D1 database..."
npx wrangler d1 execute n8n-mcp-saas-db --local --file=./schema.sql 2>/dev/null || {
    echo "Creating local database first..."
    # The database will be created automatically on first access
}

# Apply schema
echo "📊 Applying database schema..."
npx wrangler d1 execute n8n-mcp-saas-db --local --file=./schema.sql

echo ""
echo "✅ Local development setup complete!"
echo ""
echo "To start the backend:"
echo "  npx wrangler dev --local --persist"
echo ""
echo "To start the frontend (in another terminal):"
echo "  cd dashboard && npm run dev"
echo ""
echo "Backend will be at: http://localhost:8787"
echo "Frontend will be at: http://localhost:5173"
