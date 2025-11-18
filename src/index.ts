import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import menuPlanRoutes from './routes/menuPlan.routes';
import shoppingListRoutes from './routes/shoppingList.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Cargar variables de entorno
dotenv.config();

const app = new Hono();

// Middleware global de manejo de errores
app.onError(errorHandler);

// CORS middleware
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Servir archivos estáticos
app.use('/*', serveStatic({ root: './public' }));

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/menu-plans', menuPlanRoutes);
app.route('/api/shopping-lists', shoppingListRoutes);

// Ruta de prueba
app.get('/api', (c) => {
  return c.json({ message: 'Menu Planner API - Server is running' });
});

// Manejador de rutas no encontradas (404)
app.notFound(notFoundHandler);

const port = parseInt(process.env.PORT || '3000');

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`✓ Server is running on http://localhost:${info.port}`);
  }
);
