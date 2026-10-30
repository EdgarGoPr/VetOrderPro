import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';

dotenv.config();

function apiDevPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        const pathname = url.pathname.replace(/^\/api\//, '').split('/')[0];
        req.query = Object.fromEntries(url.searchParams.entries());

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            if (body) {
              req.body = JSON.parse(body);
            }
          } catch {
            req.body = {};
          }

          res.status = (code: number) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };

          try {
            let handler: any = null;
            if (pathname === 'health') {
              // @ts-ignore
              const mod = await import('./api/health.js');
              handler = mod.default;
            } else if (pathname === 'users') {
              // @ts-ignore
              const mod = await import('./api/users.js');
              handler = mod.default;
            } else if (pathname === 'accounts') {
              // @ts-ignore
              const mod = await import('./api/accounts.js');
              handler = mod.default;
            } else if (pathname === 'suppliers') {
              // @ts-ignore
              const mod = await import('./api/suppliers.js');
              handler = mod.default;
            } else if (pathname === 'categories') {
              // @ts-ignore
              const mod = await import('./api/categories.js');
              handler = mod.default;
            } else if (pathname === 'products') {
              // @ts-ignore
              const mod = await import('./api/products.js');
              handler = mod.default;
            } else if (pathname === 'orders') {
              // @ts-ignore
              const mod = await import('./api/orders.js');
              handler = mod.default;
            }

            if (handler) {
              await handler(req, res);
            } else {
              res.status(404).json({ error: `Ruta /api/${pathname} no encontrada.` });
            }
          } catch (err: any) {
            console.error('Error en API Dev Middleware:', err);
            res.status(500).json({ error: err.message || 'Error del servidor' });
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevPlugin()],
});
