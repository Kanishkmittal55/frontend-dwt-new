# Testing Setup Documentation

# Command patterns - 
`yarn test` All tests
`yarn test:run` All tests (single run)
`yarn test workspaceAPI` Files matching "workspaceAPI"
`yarn test delete` Files matching "delete"
`yarn test api` Files in /api/ folder
`yarn test src/tests/api/workspaceAPI/delete.test.js` Exact file

## Overview
This project uses **Vitest** as the testing framework with **React Testing Library** for component testing.

## Test Structure
```
src/tests/
├── setup.js              # Test environment configuration
└── api/
    └── workspaceAPI.test.js  # API endpoint tests
```

## Available Test Commands

### Run tests in watch mode (recommended for development)
```bash
yarn test
```

### Run tests once (for CI/CD)
```bash
yarn test:run
```

### Run tests with UI interface
```bash
yarn test:ui
```

### Generate coverage report
```bash
yarn test:coverage
```

## Testing the deleteWorkspace Endpoint

### Test Coverage
The `workspaceAPI.test.js` file includes:
- ✅ Successful deletion test
- ✅ API endpoint verification
- ✅ 404 error handling (workspace not found)
- ✅ 403 error handling (permission denied)
- ✅ Network error handling
- ✅ Invalid ID format handling
- ✅ Server error (500) handling
- ✅ API key header verification

### Running the Tests

1. **Install dependencies** (if not already done):
```bash
yarn install
```

2. **Run the test suite**:
```bash
yarn test
```

3. **View specific test file**:
```bash
yarn test workspaceAPI
```

4. **Watch mode with UI**:
```bash
yarn test:ui
```
Then navigate to `http://localhost:51204/__vitest__/` in your browser.

### Test Output
Successful test run will show:
```
✓ src/tests/api/workspaceAPI.test.js (8 tests) 
  ✓ workspaceAPI.deleteWorkspace (8 tests)
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

## Configuration Files

### vitest.config.js
- Configures Vitest with React plugin
- Sets up jsdom environment for DOM testing
- Configures coverage reporting
- Sets up path aliases

### src/tests/setup.js
- Imports testing utilities
- Sets up cleanup after each test
- Mocks environment variables
- Configures global fetch mock

## Next Steps

### Add More API Tests
1. Create test files for other API endpoints:
   - `getWorkspaces.test.js`
   - `createWorkspace.test.js`
   - `updateWorkspace.test.js`

2. Follow the same pattern:
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { workspaceAPI } from '../../api/workspaceAPI';

describe('workspaceAPI.yourEndpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should handle success case', async () => {
    // Arrange, Act, Assert
  });
});
```

### Add Component Tests
Create tests for React components in `src/tests/components/`.

## Troubleshooting

### Tests not running?
```bash
# Clear cache
yarn cache clean
# Reinstall dependencies
yarn install
```

### Mock not working?
Ensure `vi.clearAllMocks()` is called in `beforeEach()`.

### Import errors?
Check path aliases in `vitest.config.js` match your project structure.

## Best Practices
1. **Arrange-Act-Assert** pattern in tests
2. Use descriptive test names
3. Mock external dependencies
4. Test both success and error cases
5. Keep tests focused and isolated
6. Use `beforeEach` for setup
7. Clean up after tests
