import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'

// Sunucu bellekte store snapshot'larını tutar
const snapshots: Record<string, { value: string; ts: number }> = {};

function syncPlugin(): Plugin {
  return {
    name: 'store-sync',
    configureServer(server) {
      server.middlewares.use('/__sync', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (c: Buffer) => { body += c.toString(); });
          req.on('end', () => {
            try {
              const { key, value, ts } = JSON.parse(body) as { key: string; value: string; ts: number };
              snapshots[key] = { value, ts };
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
            } catch { res.statusCode = 400; res.end(); }
          });
          return;
        }

        if (req.method === 'GET') {
          const url = new URL(req.url!, 'http://localhost');
          const key = url.searchParams.get('key') ?? '';
          const since = Number(url.searchParams.get('since') ?? '0');
          const snap = snapshots[key];
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          // Sadece daha yeni bir snapshot varsa gönder
          if (snap && snap.ts > since) {
            res.end(JSON.stringify({ updated: true, value: snap.value, ts: snap.ts }));
          } else {
            res.end(JSON.stringify({ updated: false }));
          }
          return;
        }

        res.statusCode = 405; res.end();
      });
    },
  };
}

const VERCEL_URL = process.env.VITE_API_URL ?? 'https://randevu-fawn.vercel.app';

export default defineConfig({
  plugins: [react(), tailwindcss(), syncPlugin()],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: VERCEL_URL,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
