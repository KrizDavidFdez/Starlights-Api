
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import createCheckoutSession from './api/create-checkout-session.js';

const stripeCheckoutDevPlugin = (stripeSecretKey: string) => ({
  name: 'stripe-checkout-dev',

  configureServer(server: import('vite').ViteDevServer) {
    if (stripeSecretKey) {
      process.env.STRIPE_SECRET_KEY = stripeSecretKey;
    }

    server.middlewares.use('/api/create-checkout-session', async (req, res, next) => {
      if (req.method !== 'POST') return next();

      let rawBody = '';

      try {
        for await (const chunk of req) {
          rawBody += chunk.toString();

          if (rawBody.length > 4096) {
            res.statusCode = 413;
            res.end(JSON.stringify({ error: 'Solicitud demasiado grande.' }));
            return;
          }
        }

        const request = {
          method: req.method,
          headers: req.headers,
          body: JSON.parse(rawBody),
          query: {},
        };

        const response = {
          setHeader: (name: string, value: string) => res.setHeader(name, value),

          status(code: number) {
            res.statusCode = code;
            return this;
          },

          json(payload: unknown) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(payload));
          },
        };

        await createCheckoutSession(request, response);
      } catch {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Solicitud JSON no válida.' }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      stripeCheckoutDevPlugin(env.STRIPE_SECRET_KEY || ''),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      host: '0.0.0.0',

      // Permite dominios externos de desarrollo.
      // true acepta cualquier hostname; úsalo solo en entornos de confianza.
      allowedHosts: [
        'sb-13r3ek92v3ex.vercel.run',
        '.vercel.run',
        '.koyeb.app',
        '.vercel.app',
      ],

      hmr: process.env.DISABLE_HMR !== 'true',

      watch: process.env.DISABLE_HMR === 'true'
        ? null
        : {},
    },
  };
});
