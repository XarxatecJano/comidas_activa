import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = new Hono();

// Ruta de prueba
app.get('/', (c) => {
  return c.json({ message: 'Menu Planner API - Server is running' });
});

const port = parseInt(process.env.PORT || '3000');

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
