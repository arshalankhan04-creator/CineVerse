export default async function handler(req, res) {
  // Support CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Support Vercel query parsing (req.query is an object parsed by Vercel)
  const urlObj = new URL(req.url, 'http://localhost');
  const endpoint = urlObj.searchParams.get('endpoint');

  if (!endpoint) {
    res.status(400).json({ error: 'Endpoint query parameter is required' });
    return;
  }

  const API_BASE = 'https://api.themoviedb.org/3';
  const TMDB_KEY = process.env.REACT_APP_TMDB_KEY || process.env.VITE_TMDB_KEY || '';

  const headers = {
    accept: 'application/json',
  };

  const params = new URLSearchParams();
  urlObj.searchParams.forEach((value, key) => {
    if (key !== 'endpoint') {
      params.append(key, value);
    }
  });

  if (TMDB_KEY.trim().length > 50) {
    headers['Authorization'] = `Bearer ${TMDB_KEY.trim()}`;
  } else {
    params.append('api_key', TMDB_KEY.trim());
  }

  const queryString = params.toString();
  const url = `${API_BASE}${endpoint}${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(url, { headers });
    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json(data);
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
