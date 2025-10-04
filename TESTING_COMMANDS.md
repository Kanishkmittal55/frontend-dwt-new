# Testing Commands - Quick Reference

## Execute in Order (First Time Setup)

```bash
# 1. Navigate to project
cd /Users/kanishkmittal/Desktop/Company/apiopener-frontend/berry-free-react-admin-template/vite

# 2. Install dependencies
yarn install

# 3. Run tests (choose one)
yarn test              # Watch mode (recommended)
yarn test:ui           # Interactive UI (best for first time)
yarn test:run          # Run once
yarn test:coverage     # With coverage report
```

## Daily Development Commands

```bash
# Start development with tests watching
yarn test

# Or run tests with UI in browser
yarn test:ui
```

## Specific Test Commands

```bash
# Run only deleteWorkspace tests
yarn test workspaceAPI.delete

# Run all workspace API tests
yarn test workspaceAPI

# Run tests in specific directory
yarn test api/
```

## Coverage Commands

```bash
# Generate coverage report
yarn test:coverage

# View coverage in browser
# After running coverage, open:
# ./coverage/index.html
```

## Vitest Interactive Commands (in watch mode)

Press these keys when `yarn test` is running:

| Key | Action |
|-----|--------|
| `a` | Run all tests |
| `f` | Run only failed tests |
| `p` | Filter by filename |
| `t` | Filter by test name |
| `q` | Quit |
| `h` | Show help |
| `c` | Clear console |

## Debugging Commands

```bash
# Run tests with verbose output
yarn test --reporter=verbose

# Run tests with Node debugging
node --inspect-brk ./node_modules/vitest/vitest.mjs

# Run single test file
yarn test src/tests/api/workspaceAPI.delete.test.js
```

## CI/CD Commands

```bash
# For continuous integration
yarn test:run --coverage

# With reporter for CI
yarn test:run --reporter=json
```

## Files to Check

```bash
# View test results
cat coverage/coverage-summary.json

# View test configuration
cat vitest.config.js

# View test setup
cat src/tests/setup.js
```

## Verify Setup

```bash
# Quick verification (should pass all tests)
yarn test:run

# Expected output:
# ✓ src/tests/api/workspaceAPI.delete.test.js (10)
# ✓ src/tests/api/workspaceAPI.test.js (8)
# Test Files  2 passed (2)
# Tests  18 passed (18)
```

## Common Workflows

### Adding a New Test
```bash
# 1. Create test file
touch src/tests/api/newEndpoint.test.js

# 2. Start watch mode
yarn test

# 3. Write test (it will auto-run)
# Edit newEndpoint.test.js

# 4. Tests run automatically on save
```

### Debugging a Failing Test
```bash
# 1. Run test UI
yarn test:ui

# 2. Click on failing test in browser
# 3. View error details
# 4. Fix code and save (auto-reruns)
```

### Before Committing
```bash
# Run full test suite
yarn test:run

# Check coverage
yarn test:coverage

# Lint code
yarn lint

# All pass? Ready to commit!
git add .
git commit -m "Add tests for workspace API"
```

## Environment Variables

```bash
# Set API URL for tests
export VITE_WHYHOW_API_URL=http://localhost:8000

# Set API key for tests
export VITE_WHYHOW_API_KEY=your-test-key

# Run tests with custom env
VITE_WHYHOW_API_URL=http://test.api yarn test:run
```

## Troubleshooting Commands

```bash
# Clear Vitest cache
rm -rf node_modules/.vitest

# Reinstall dependencies
rm -rf node_modules
yarn install

# Check Vitest version
yarn vitest --version

# Update Vitest
yarn upgrade vitest @vitest/ui
```

---

**Quick Start**: `yarn test:ui` (opens browser with interactive test runner)

**Daily Use**: `yarn test` (watch mode for development)

**Before Commit**: `yarn test:run` (run all tests once)
