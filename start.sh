#!/bin/bash

echo "🔧 Fixing project setup..."
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Remove conflicting lock files
echo "📦 Removing conflicting lock files..."
rm -f package-lock.json
rm -f yarn.lock

# Mark index.html as resolved
git add index.html 2>/dev/null || true

# Clear yarn cache
echo "🧹 Clearing yarn cache..."
yarn cache clean

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Start the development server
echo "🚀 Starting development server..."
yarn dev
