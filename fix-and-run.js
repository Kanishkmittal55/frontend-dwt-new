#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing merge conflicts and reinstalling dependencies...\n');

const projectDir = process.cwd();

// Step 1: Remove package-lock.json if it exists
const packageLockPath = path.join(projectDir, 'package-lock.json');
if (fs.existsSync(packageLockPath)) {
    fs.unlinkSync(packageLockPath);
    console.log('✅ Removed package-lock.json');
}

// Step 2: Remove corrupted yarn.lock
const yarnLockPath = path.join(projectDir, 'yarn.lock');
if (fs.existsSync(yarnLockPath)) {
    fs.unlinkSync(yarnLockPath);
    console.log('✅ Removed corrupted yarn.lock');
}

// Step 3: Clear yarn cache
try {
    console.log('🧹 Clearing yarn cache...');
    execSync('yarn cache clean', { stdio: 'inherit' });
} catch (e) {
    console.log('⚠️  Could not clear yarn cache, continuing...');
}

// Step 4: Reinstall dependencies
console.log('\n📦 Installing dependencies with yarn...');
try {
    execSync('yarn install', { stdio: 'inherit' });
    console.log('\n✅ Dependencies installed successfully!');
} catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
    process.exit(1);
}

// Step 5: Try to start the development server
console.log('\n🚀 Starting development server...');
try {
    execSync('yarn dev', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Error starting dev server:', error.message);
}
