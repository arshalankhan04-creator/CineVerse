const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Custom fetch wrapper that automatically injects the JWT token
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('cineverse_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // If unauthorized (401), we should clear token (optionally)
  if (response.status === 401) {
    localStorage.removeItem('cineverse_token');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  // Some delete requests might return 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // Authentication
  register: (username, email, password) => 
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (email, password) => 
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request('/auth/me'),

  updateProfileTheme: (theme) => 
    request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ theme }),
    }),

  // Watchlist
  getWatchlist: () => request('/watchlist'),
  
  addToWatchlist: (item) => 
    request('/watchlist', {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  removeFromWatchlist: (tmdbId) => 
    request(`/watchlist/${tmdbId}`, {
      method: 'DELETE',
    }),

  // Custom Lists
  getLists: () => request('/lists'),

  createList: (name, description) => 
    request('/lists', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  updateListItems: (listId, items) => 
    request(`/lists/${listId}/items`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    }),

  deleteList: (listId) => 
    request(`/lists/${listId}`, {
      method: 'DELETE',
    }),

  // Trivia
  submitScore: (score, category) => 
    request('/trivia/score', {
      method: 'POST',
      body: JSON.stringify({ score, category }),
    }),

  getLeaderboard: () => request('/trivia/leaderboard'),
};
