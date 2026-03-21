/**
 * API Client - CommunityPulse
 * Centralized API calls with auth handling
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Make authenticated API request
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise<any>}
 */
export async function api(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  // Handle auth errors globally
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Authentication required');
  }
  
  if (response.status === 403) {
    throw new Error('Access denied');
  }

  // Handle non-JSON responses (exports)
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/csv') || contentType?.includes('application/octet-stream')) {
    return response.blob();
  }

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

// ===== AUTH API =====
export const authApi = {
  register: (data) => api('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => api('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => api('/auth/profile'),
  updateProfile: (data) => api('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => api('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),
  checkUsername: (username) => api(`/auth/check-username?username=${encodeURIComponent(username)}`)
};

// ===== FEEDBACK API =====
export const feedbackApi = {
  getCategories: () => api('/feedback/categories'),
  submit: (data) => api('/feedback', { method: 'POST', body: JSON.stringify(data) }),
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return api(`/feedback${query ? `?${query}` : ''}`);
  },
  get: (id) => api(`/feedback/${id}`),
  update: (id, data) => api(`/feedback/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => api(`/feedback/${id}`, { method: 'DELETE' }),
  vote: (data) => api('/feedback/vote', { method: 'POST', body: JSON.stringify(data) }),
  getVote: (feedbackId) => api(`/feedback/vote/${feedbackId}`),
  removeVote: (feedbackId) => api(`/feedback/vote/${feedbackId}`, { method: 'DELETE' })
};

// ===== ADMIN API =====
export const adminApi = {
  getStats: () => api('/admin/stats'),
  getAnalytics: (params) => {
    const query = new URLSearchParams(params).toString();
    return api(`/admin/analytics${query ? `?${query}` : ''}`);
  },
  getPending: (params) => {
    const query = new URLSearchParams(params).toString();
    return api(`/admin/pending${query ? `?${query}` : ''}`);
  },
  updateStatus: (id, data) => api(`/admin/feedback/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFeedback: (id) => api(`/admin/feedback/${id}`, { method: 'DELETE' }),
  getCategories: () => api('/admin/categories'),
  createCategory: (data) => api('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => api(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => api(`/admin/categories/${id}`, { method: 'DELETE' }),
  getUsers: (params) => {
    const query = new URLSearchParams(params).toString();
    return api(`/admin/users${query ? `?${query}` : ''}`);
  },
  updateUserRole: (id, data) => api(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateUser: (id) => api(`/admin/users/${id}`, { method: 'DELETE' }),
  export: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/admin/export${query ? `?${query}` : ''}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  }
};

// Add to existing api.js file

/**
 * Analyze sentiment of text using backend AI
 * @param {string} text - Message to analyze
 * @returns {Promise<{label: string, confidence: number}>}
 */
export async function analyzeSentiment(text) {
  // For preview only - actual analysis happens on backend during submission
  // This is a client-side preview estimate
  
  if (!text || text.length < 10) {
    return { label: 'Neutral', confidence: 0 };
  }

  // Simple keyword-based preview (real analysis happens on backend)
  const positiveWords = ['great', 'good', 'excellent', 'amazing', 'love', 'perfect', 'helpful', 'awesome', 'fantastic', 'wonderful'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing', 'frustrating', 'poor', 'issue', 'problem'];
  
  const textLower = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (textLower.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (textLower.includes(word)) negativeCount++;
  });
  
  const total = positiveCount + negativeCount;
  if (total === 0) {
    return { label: 'Neutral', confidence: 0.5 };
  }
  
  if (positiveCount > negativeCount) {
    return { 
      label: 'Positive', 
      confidence: positiveCount / total 
    };
  } else if (negativeCount > positiveCount) {
    return { 
      label: 'Negative', 
      confidence: negativeCount / total 
    };
  }
  
  return { label: 'Neutral', confidence: 0.5 };
}