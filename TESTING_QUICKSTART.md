# Quick Start: Testing Setup

## 1. Prerequisites Check
```bash
# Verify you're in the project directory
pwd
# Should show: .../berry-free-react-admin-template/vite

# Check Node and Yarn versions
node --version  # Should be v18+
yarn --version  # Should be 4.x
```

## 2. Install Dependencies
```bash
yarn install
```

## 3. Run Your First Test
```bash
# Run all tests
yarn test

# Or run with UI (recommended first time)
yarn test:ui
```

## 4. Expected Output
```
 ✓ src/tests/api/workspaceAPI.test.js (8)
   ✓ workspaceAPI.deleteWorkspace (8)
     ✓ should successfully delete a workspace
     ✓ should verify correct API endpoint is called
     ✓ should handle 404 error when workspace not found
     ✓ should handle 403 error when user lacks permission
     ✓ should handle network errors gracefully
     ✓ should handle invalid workspace ID format
     ✓ should handle server error (500)
     ✓ should use correct API key in headers

 Test Files  1 passed (1)
      Tests  8 passed (8)
```

## 5. Test Commands Cheat Sheet
| Command | Purpose |
|---------|---------|
| `yarn test` | Run tests in watch mode |
| `yarn test:run` | Run tests once (CI/CD) |
| `yarn test:ui` | Interactive test UI |
| `yarn test:coverage` | Generate coverage report |

## 6. File Structure Created
```
vite/
├── vitest.config.js          # Vitest configuration
├── src/
│   └── tests/
│       ├── setup.js          # Test setup & mocks
│       ├── README.md         # Full documentation
│       └── api/
│           └── workspaceAPI.test.js  # Delete endpoint tests
```

## 7. Common Issues & Fixes

### Issue: "Cannot find module"
```bash
yarn install
```

### Issue: Tests hanging
Press `q` to quit watch mode, then:
```bash
yarn test:run
```

### Issue: Port already in use (for UI)
Kill the process on port 51204 or let Vitest auto-assign a new port.

## 8. Next Steps
1. ✅ Run the test suite
2. Open `src/tests/api/workspaceAPI.test.js` to see test examples
3. Add tests for other endpoints (copy the pattern)
4. Read `src/tests/README.md` for detailed documentation

## 9. Pro Tips
- Use `yarn test:ui` for visual debugging
- Press `f` in watch mode to run only failed tests
- Press `p` to filter by filename pattern
- Use `describe.only()` or `it.only()` to run specific tests

## 10. Verify Everything Works
```bash
# Quick verification
yarn test:run

# Should pass all 8 tests
# If any fail, check your API setup
```

---
🎉 **You're all set!** The testing infrastructure is ready to use.
