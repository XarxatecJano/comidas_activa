import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexión inactiva
  connectionTimeoutMillis: 2000, // Tiempo máximo de espera para obtener conexión
};

const pool = new Pool(poolConfig);

// Evento de conexión exitosa
pool.on('connect', (client) => {
  console.log('✓ New client connected to PostgreSQL database');
});

// Evento de error en cliente inactivo
pool.on('error', (err, client) => {
  console.error('✗ Unexpected error on idle PostgreSQL client', err);
});

// Evento de eliminación de cliente
pool.on('remove', (client) => {
  console.log('Client removed from pool');
});

// Función para verificar la conexión
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✓ PostgreSQL connection test successful');
    return true;
  } catch (error) {
    console.error('✗ PostgreSQL connection test failed:', error);
    return false;
  }
}

// Función para cerrar el pool de conexiones
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('PostgreSQL pool closed');
}

export default pool;
