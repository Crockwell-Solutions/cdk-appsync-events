import { getConfig } from '@/config';

export const apiClient = {
  async post<T>(endpoint: string, data: any): Promise<T> {
    const config = getConfig();
    if (!config) {
      throw new Error('API configuration not loaded');
    }

    const response = await fetch(`${config.restApiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': config.restApiKey,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  },

  async get<T>(endpoint: string): Promise<T> {
    const config = getConfig();
    if (!config) {
      throw new Error('API configuration not loaded');
    }

    const response = await fetch(`${config.restApiUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': config.restApiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  },
};
