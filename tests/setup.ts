import pool from '../src/config/database';

// Cerrar el pool solo después de TODOS los tests
afterAll(async () => {
  await pool.end();
});
