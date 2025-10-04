// WhyHow API Base Client Configuration
// Using Vite environment variables
// Use proxy in development to avoid CORS issues
const API_BASE_URL = import.meta.env.VITE_WHYHOW_API_URL || 
  (import.meta.env.DEV ? '/api' : 'http://localhost:8000');
const API_KEY = import.meta.env.VITE_WHYHOW_API_KEY || 'bmCRyIf9cSdHUdo7iV46wdllmrVRzcUhgSRCrmzi';

// Base API client with authentication
class WhyHowClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.apiKey = API_KEY;
    this.defaultHeaders = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers
        }
      });

      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status}`;
        try {
          const error = await response.json();
          // Handle different error response formats
          if (error.detail) {
            // FastAPI typically uses 'detail' field
            if (typeof error.detail === 'string') {
              errorMessage = error.detail;
            } else if (Array.isArray(error.detail)) {
              // Validation errors often come as array
              errorMessage = error.detail.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
            } else if (typeof error.detail === 'object') {
              errorMessage = JSON.stringify(error.detail);
            }
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.errors) {
            errorMessage = JSON.stringify(error.errors);
          }
        } catch (e) {
          // If response is not JSON, keep the default error message
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Export the base client for use in other API modules
export { WhyHowClient };
export default WhyHowClient;
