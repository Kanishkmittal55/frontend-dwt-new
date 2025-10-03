#!/bin/bash
cd /Users/kanishkmittal/Desktop/Company/apiopener-frontend/berry-free-react-admin-template/vite

# Remove the conflicting files
rm -f package-lock.json
rm -f yarn.lock

# Mark the conflicts as resolved in git
git add index.html
git rm package-lock.json 2>/dev/null || true

# Reinstall dependencies with yarn
yarn install
