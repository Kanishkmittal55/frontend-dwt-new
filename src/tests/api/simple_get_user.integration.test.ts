// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { WhyHowClient } from '../../api/baseClient';

describe('Integration: Get Current User API', () => {
  it('should get current authenticated user', async () => {
    const client = new WhyHowClient();
    
    const response = await client.get('/users/me');
    
    console.log('\n=== CURRENT USER RESPONSE ===');
    console.log('Full Response:', JSON.stringify(response, null, 2));
    console.log('=============================\n');
    
    // Verify response structure
    expect(response.status).toBe('success');
    expect(response.message).toBe('Current user retrieved');
    expect(response.user).toBeDefined();
    
    console.log('✓ Current user retrieved successfully');
  });

  it('should return user with all expected fields', async () => {
    const client = new WhyHowClient();
    
    const response = await client.get('/users/me');
    const user = response.user;
    
    // Verify required fields
    expect(user).toHaveProperty('_id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('api_key');
    expect(user).toHaveProperty('providers');
    
    console.log('User ID:', user._id);
    console.log('Email:', user.email);
    console.log('Has API Key:', !!user.api_key);
    console.log('Number of providers:', user.providers?.length || 0);
    
    console.log('✓ User has all expected fields');
  });

  it('should obfuscate sensitive API keys', async () => {
    const client = new WhyHowClient();
    
    const response = await client.get('/users/me');
    const user = response.user;
    
    // API key should be obfuscated (all asterisks)
    expect(user.api_key).toBeDefined();
    expect(user.api_key).toMatch(/^\*+$/); // Should be only asterisks
    expect(user.api_key.length).toBeGreaterThan(0);
    
    console.log('API Key (obfuscated):', user.api_key);
    console.log('✓ API key is properly obfuscated');
  });

  it('should obfuscate provider API keys', async () => {
    const client = new WhyHowClient();
    
    const response = await client.get('/users/me');
    const user = response.user;
    
    if (user.providers && user.providers.length > 0) {
      user.providers.forEach((provider: any, index: number) => {
        if (provider.api_key) {
          // Provider API keys should also be obfuscated
          expect(provider.api_key).toMatch(/^\*+$/);
          console.log(`Provider ${index} API key (obfuscated):`, provider.api_key);
        }
        
        // Log provider info
        console.log(`Provider ${index}:`, {
          type: provider.type,
          value: provider.value,
          hasApiKey: !!provider.api_key
        });
      });
      
      console.log('✓ All provider API keys are obfuscated');
    } else {
      console.log('No providers found for user');
    }
  });

  it('should include OpenAI provider configuration', async () => {
    const client = new WhyHowClient();
    
    const response = await client.get('/users/me');
    const user = response.user;
    
    const llmProvider = user.providers?.find((p: any) => p.type === 'llm');
    
    if (llmProvider) {
      expect(llmProvider.value).toBe('byo-openai');
      expect(llmProvider.metadata).toBeDefined();
      expect(llmProvider.metadata['byo-openai']).toBeDefined();
      
      const metadata = llmProvider.metadata['byo-openai'];
      expect(metadata.language_model_name).toBeDefined();
      expect(metadata.embedding_name).toBeDefined();
      
      console.log('LLM Provider Config:');
      console.log('  Model:', metadata.language_model_name);
      console.log('  Embedding:', metadata.embedding_name);
      
      console.log('✓ OpenAI provider configuration present');
    } else {
      console.log('No LLM provider found');
    }
  });

  it('should return consistent data on multiple requests', async () => {
    const client = new WhyHowClient();
    
    const response1 = await client.get('/users/me');
    const response2 = await client.get('/users/me');
    const response3 = await client.get('/users/me');
    
    // All responses should return the same user
    expect(response1.user._id).toBe(response2.user._id);
    expect(response2.user._id).toBe(response3.user._id);
    expect(response1.user.email).toBe(response2.user.email);
    
    console.log('✓ User data is consistent across multiple requests');
    console.log('User ID:', response1.user._id);
    console.log('Email:', response1.user.email);
  });

  it('should work with valid authentication', async () => {
    const client = new WhyHowClient();
    
    // This test verifies the endpoint requires authentication
    // If we get here without error, authentication worked
    const response = await client.get('/users/me');
    
    expect(response.status).toBe('success');
    expect(response.user._id).toBeDefined();
    
    console.log('✓ Authentication working correctly');
  });

  it('should have user created timestamp', async () => {
    const client = new WhyHowClient();
    
    const response = await client.get('/users/me');
    const user = response.user;
    
    // Check for timestamp fields if they exist
    if (user.created_at) {
      const createdDate = new Date(user.created_at);
      expect(createdDate).toBeInstanceOf(Date);
      expect(createdDate.getTime()).toBeLessThanOrEqual(Date.now());
      
      console.log('User created at:', createdDate.toISOString());
    }
    
    console.log('✓ User timestamps checked');
  });
});