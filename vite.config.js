import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'tmdb-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url.startsWith('/api/tmdb')) {
              try {
                const urlObj = new URL(req.url, 'http://localhost');
                const endpoint = urlObj.searchParams.get('endpoint');
                
                if (!endpoint) {
                  res.statusCode = 400;
                  return res.end(JSON.stringify({ error: 'Endpoint is required' }));
                }

                const params = new URLSearchParams();
                urlObj.searchParams.forEach((value, key) => {
                  if (key !== 'endpoint') {
                    params.append(key, value);
                  }
                });

                const TMDB_KEY = env.REACT_APP_TMDB_KEY || env.VITE_TMDB_KEY || '';
                const headers = {
                  accept: 'application/json'
                };

                if (TMDB_KEY.trim().length > 50) {
                  headers['Authorization'] = `Bearer ${TMDB_KEY.trim()}`;
                } else {
                  params.append('api_key', TMDB_KEY.trim());
                }

                const queryString = params.toString();
                const targetUrl = `https://api.themoviedb.org/3${endpoint}${queryString ? `?${queryString}` : ''}`;

                const response = await fetch(targetUrl, { headers });
                const data = await response.json();
                
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify(data));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            } else {
              next();
            }
          });
        }
      }
    ],
    envPrefix: ['VITE_', 'REACT_APP_'],
  };
})
