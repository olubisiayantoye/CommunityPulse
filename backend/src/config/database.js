/**
 * Database Configuration - CommunityPulse
 * PostgreSQL connection pool setup with query helper
 * 
 * @module config/database
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// Log connection success in development
if (process.env.NODE_ENV === 'development') {
  pool.on('connect', () => {
    console.log('🗄️  Database connection established');
  });
}

/**
 * Execute a parameterized query with logging
 * @param {string} text - SQL query text with $1, $2 placeholders
 * @param {Array} params - Query parameters
 * @returns {Promise<QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.log('⚠️  Slow query', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (err) {
    console.error('❌ Database query error', { 
      text: text.substring(0, 100) + '...', 
      error: err.message,
      params 
    });
    throw err;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>}
 */
async function getClient() {
  return pool.connect();
}

/**
 * Health check - verify database connection
 * @returns {Promise<boolean>}
 */
async function healthCheck() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('Database health check failed:', err.message);
    return false;
  }
}

// ===== EXPORTS (FIXED) =====
// Named exports for: import { query, pool } from './database.js'
export { query, pool, getClient, healthCheck };

// Default export for: import db from './database.js' (optional compatibility)
export default { query, pool, getClient, healthCheck };