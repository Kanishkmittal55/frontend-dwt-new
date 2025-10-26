// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { WhyHowClient } from '../../api/baseClient';

describe('Integration: User Status API', () => {
  it('should get current user status and log user details', async () => {
    const client = new WhyHowClient();
    
    // Call the user status endpoint
    const response = await client.get('/users/status');
    
    console.log('\n=== USER STATUS RESPONSE ===');
    console.log('Full Response:', JSON.stringify(response, null, 2));
    console.log('============================\n');
    
    // Verify response structure
    expect(response).toBeDefined();
    expect(response.status).toBe('success');
    expect(response.message).toBeDefined();
    expect(typeof response.active).toBe('boolean');
    
    // Log individual fields
    console.log('User Active Status:', response.active);
    console.log('Message:', response.message);
    console.log('Count:', response.count);
    
    // Verify user is active (should be true for authenticated test user)
    expect(response.active).toBe(true);
    expect(response.count).toBe(1);
    expect(response.message).toBe('User status retrieved successfully');
    
    console.log('\n✓ User status endpoint working correctly');
  });

  it('should have consistent response structure', async () => {
    const client = new WhyHowClient();
    const response = await client.get('/users/status');
    
    // Verify all expected fields are present
    const expectedFields = ['message', 'status', 'count', 'active'];
    expectedFields.forEach(field => {
      expect(response).toHaveProperty(field);
    });
    
    console.log('Response contains all expected fields:', expectedFields);
  });

  it('should return user as active for authenticated requests', async () => {
    const client = new WhyHowClient();
    const response = await client.get('/users/status');
    
    // Since we're making authenticated requests in tests,
    // the user should exist and be active
    expect(response.active).toBe(true);
    expect(response.count).toBeGreaterThan(0);
    
    console.log('✓ Authenticated user is active');
  });

  it('should handle multiple consecutive status checks', async () => {
    const client = new WhyHowClient();
    
    // Make multiple requests
    const response1 = await client.get('/users/status');
    const response2 = await client.get('/users/status');
    const response3 = await client.get('/users/status');
    
    // All should return the same active status
    expect(response1.active).toBe(response2.active);
    expect(response2.active).toBe(response3.active);
    
    console.log('✓ Status endpoint is consistent across multiple calls');
    console.log('All calls returned active =', response1.active);
  });
});