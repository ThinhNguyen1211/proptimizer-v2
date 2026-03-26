/**
 * API Configuration & Utilities
 * FIXED: Using correct ap-southeast-1 region
 */

import { fetchAuthSession } from 'aws-amplify/auth';

// CORRECT API URL - ap-southeast-1 region
export const API_BASE_URL = import.meta.env['VITE_API_BASE_URL'];

/**
 * Get authentication token from AWS Amplify session
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) {
      console.warn('No ID token found in session');
      return null;
    }
    return token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

/**
 * Fetch user's chat history
 */
export async function fetchHistory() {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/history`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.status}`);
  }
  
  return response.json();
}


/**
 * Fetch user's own templates
 */
export async function fetchMyTemplates(): Promise<any[]> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/templates/my`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.templates || [];
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
}
