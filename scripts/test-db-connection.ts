import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Parse the connection string
  try {
    const url = new URL(databaseUrl);
    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    
    console.log('📋 Connection details:');
    console.log(`   Environment: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   Username: ${url.username}`);
    console.log(`   SSL: ${isProduction ? 'enabled' : 'disabled'}`);
    console.log(`   Type: ${isLocalhost ? 'Local PostgreSQL' : 'Remote (Supabase/Cloud)'}\n`);
    
    // Check if using connection pooling (port 6543) for remote databases
    if (!isLocalhost) {
      if (url.port === '5432') {
        console.warn('⚠️  WARNING: You are using direct connection (port 5432)');
        console.warn('   For Render deployment, use Connection Pooling (port 6543)');
        console.warn('   Go to Supabase → Settings → Database → Connection string → Transaction mode\n');
      } else if (url.port === '6543') {
        console.log('✅ Using Connection Pooling (port 6543) - Recommended for Render\n');
      }
    } else {
      console.log('✅ Local database connection - No pooling needed\n');
    }
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error);
    process.exit(1);
  }

  // Test the connection
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔌 Attempting to connect...');
    const client = await pool.connect();
    
    console.log('✅ Connection successful!\n');
    
    // Test a simple query
    console.log('📊 Running test query...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query successful!');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].pg_version.split(',')[0]}\n`);
    
    // Check if tables exist
    console.log('🔍 Checking for application tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.warn('⚠️  No tables found in database');
      console.warn('   You may need to run migrations\n');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');
    }
    
    client.release();
    await pool.end();
    
    console.log('✅ All tests passed! Database connection is working correctly.\n');
    process.exit(0);
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 'ENETUNREACH') {
      console.error('\n💡 Solution:');
      console.error('   This error usually means you are using IPv6 connection (port 5432)');
      console.error('   Switch to Connection Pooling in Supabase:');
      console.error('   1. Go to Supabase Dashboard');
      console.error('   2. Settings → Database → Connection string');
      console.error('   3. Select "Transaction" mode');
      console.error('   4. Copy the connection string (should use port 6543)');
      console.error('   5. Update DATABASE_URL in Render environment variables\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Solution:');
      console.error('   Connection refused - check if:');
      console.error('   1. The database host and port are correct');
      console.error('   2. The database is running');
      console.error('   3. Firewall rules allow the connection\n');
    } else if (error.code === '28P01') {
      console.error('\n💡 Solution:');
      console.error('   Authentication failed - check if:');
      console.error('   1. The password in DATABASE_URL is correct');
      console.error('   2. The username is correct\n');
    }
    
    await pool.end();
    process.exit(1);
  }
}

testDatabaseConnection();
