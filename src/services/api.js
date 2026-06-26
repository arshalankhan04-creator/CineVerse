const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL;
  if (!envUrl) {
    return 'http://localhost:5000/api';
  }
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  if (!trimmed.endsWith('/api')) {
    return `${trimmed}/api`;
  }
  return trimmed;
};

const API_BASE = getApiBase();

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

  getMe: async () => {
    const res = await request('/auth/me');
    return res.data;
  },

  updateProfileTheme: (theme) => 
    request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ theme }),
    }),

  updateGenres: (genres) => 
    request('/auth/me/genres', {
      method: 'PUT',
      body: JSON.stringify({ genres }),
    }),

  // Watched History
  getWatched: async () => {
    const res = await request('/watched');
    return res.data;
  },

  getWatchedStats: async () => {
    const res = await request('/watched/stats');
    return res.data;
  },

  addToWatched: async (item) => {
    const res = await request('/watched', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return res.data;
  },

  removeFromWatched: async (tmdbId) => {
    const res = await request(`/watched/${tmdbId}`, {
      method: 'DELETE',
    });
    return res.data;
  },


  // Watchlist
  getWatchlist: async () => {
    const res = await request('/watchlist');
    return res.data;
  },
  
  addToWatchlist: async (item) => {
    const res = await request('/watchlist', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return res.data;
  },

  removeFromWatchlist: async (tmdbId) => {
    const res = await request(`/watchlist/${tmdbId}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  // Custom Lists
  getLists: async () => {
    const res = await request('/lists');
    return res.data;
  },

  createList: async (name, description, items = []) => {
    const res = await request('/lists', {
      method: 'POST',
      body: JSON.stringify({ name, description, items }),
    });
    return res.data;
  },

  updateListItems: async (listId, items) => {
    const res = await request(`/lists/${listId}/items`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
    return res.data;
  },

  deleteList: async (listId) => {
    const res = await request(`/lists/${listId}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  // Trivia
  submitScore: async (score, category) => {
    const res = await request('/trivia/score', {
      method: 'POST',
      body: JSON.stringify({ score, category }),
    });
    return res.data;
  },

  getLeaderboard: async () => {
    const res = await request('/trivia/leaderboard');
    return res.data;
  },
};
