import { Pool } from 'pg';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Initializing database...');
    
    const schemaPath = join(__dirname, '../migrations/20240101000000_initial_schema.sql');
    const sql = await readFile(schemaPath, 'utf-8');
    
    await pool.query(sql);
    
    console.log('✅ Database initialized successfully!');
    
    // Verify data
    const verify = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM feedback) as feedback
    `);
    
    console.log('📊 Data loaded:', verify.rows[0]);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();