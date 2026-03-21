/**
 * CommunityPulse Database Seed Script
 * Run with: node scripts/seed.js
 * 
 * ⚠️ FOR DEVELOPMENT ONLY - Do not run in production
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Default credentials (hashed)
const ADMIN_PASSWORD = 'Admin@2024!Secure';
const MEMBER_PASSWORD = 'Member@2024!Safe';

// Sample data
const SAMPLE_CATEGORIES = [
  { name: 'General', description: 'General feedback and suggestions', color: '#3B82F6' },
  { name: 'Facilities', description: 'Building, equipment, infrastructure', color: '#10B981' },
  { name: 'Events', description: 'Community events and activities', color: '#F59E0B' },
  { name: 'Leadership', description: 'Management and leadership concerns', color: '#EF4444' },
  { name: 'Safety', description: 'Safety and security issues', color: '#DC2626' },
  { name: 'Technology', description: 'IT systems and digital tools', color: '#8B5CF6' }
];

const SAMPLE_FEEDBACK = [
  {
    message: 'The new community center hours are perfect! Much more convenient for working families.',
    category: 'Facilities',
    sentiment_label: 'Positive',
    sentiment_score: 0.92,
    is_anonymous: false,
    status: 'resolved',
    upvotes: 15
  },
  {
    message: 'Parking is still a major issue during weekend events. We need more spaces or a shuttle service.',
    category: 'Facilities',
    sentiment_label: 'Negative',
    sentiment_score: 0.18,
    is_anonymous: true,
    status: 'pending',
    upvotes: 23
  },
  {
    message: 'Love the new newsletter format! Easy to read and great content.',
    category: 'Events',
    sentiment_label: 'Positive',
    sentiment_score: 0.88,
    is_anonymous: false,
    status: 'resolved',
    upvotes: 8
  },
  {
    message: 'The leadership team seems disconnected from member concerns. More town halls would help.',
    category: 'Leadership',
    sentiment_label: 'Negative',
    sentiment_score: 0.25,
    is_anonymous: true,
    status: 'in_progress',
    upvotes: 31
  },
  {
    message: 'Great job on the security upgrades at the main entrance. Feeling much safer now.',
    category: 'Safety',
    sentiment_label: 'Positive',
    sentiment_score: 0.95,
    is_anonymous: false,
    status: 'resolved',
    upvotes: 19
  },
  {
    message: 'The mobile app keeps crashing when I try to submit feedback. Please fix.',
    category: 'Technology',
    sentiment_label: 'Negative',
    sentiment_score: 0.12,
    is_anonymous: true,
    status: 'pending',
    upvotes: 12
  },
  {
    message: 'The summer festival was amazing! Hope we can make it an annual tradition.',
    category: 'Events',
    sentiment_label: 'Positive',
    sentiment_score: 0.97,
    is_anonymous: false,
    status: 'resolved',
    upvotes: 45
  },
  {
    message: 'Communication about schedule changes could be better. I missed two meetings last month.',
    category: 'General',
    sentiment_label: 'Neutral',
    sentiment_score: 0.48,
    is_anonymous: true,
    status: 'pending',
    upvotes: 7
  },
  {
    message: 'The new online payment system is confusing. Need better instructions or a tutorial.',
    category: 'Technology',
    sentiment_label: 'Negative',
    sentiment_score: 0.31,
    is_anonymous: false,
    status: 'in_progress',
    upvotes: 18
  },
  {
    message: 'Appreciate the quick response to my maintenance request last week. Excellent service!',
    category: 'Facilities',
    sentiment_label: 'Positive',
    sentiment_score: 0.91,
    is_anonymous: false,
    status: 'resolved',
    upvotes: 11
  }
];

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seed...');
    
    // Clear existing test data (development only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧹 Clearing existing test data...');
      await client.query('DELETE FROM feedback_votes WHERE user_id IN (SELECT id FROM users WHERE username IN ($1, $2))', ['admin', 'member']);
      await client.query('DELETE FROM feedback WHERE user_id IN (SELECT id FROM users WHERE username IN ($1, $2))', ['admin', 'member']);
      await client.query('DELETE FROM users WHERE username IN ($1, $2)', ['admin', 'member']);
      // Keep categories - they're reference data
    }
    
    // Create default users
    console.log('👥 Creating default users...');
    
    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const memberHash = await bcrypt.hash(MEMBER_PASSWORD, 12);
    
    const adminResult = await client.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role
       RETURNING id`,
      ['admin', 'admin@communitypulse.org', adminHash, 'admin', true]
    );
    
    const memberResult = await client.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role
       RETURNING id`,
      ['member', 'member@communitypulse.org', memberHash, 'member', true]
    );
    
    const adminId = adminResult.rows[0].id;
    const memberId = memberResult.rows[0].id;
    
    console.log('✅ Default users created');
    
    // Ensure categories exist
    console.log('📁 Seeding categories...');
    for (const cat of SAMPLE_CATEGORIES) {
      await client.query(
        `INSERT INTO categories (name, description, color) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, color = EXCLUDED.color`,
        [cat.name, cat.description, cat.color]
      );
    }
    console.log('✅ Categories seeded');
    
    // Get category IDs for feedback
    const categories = await client.query('SELECT id, name FROM categories');
    const categoryMap = {};
    categories.rows.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    // Insert sample feedback
    console.log('💬 Seeding sample feedback...');
    const now = new Date();
    
    for (let i = 0; i < SAMPLE_FEEDBACK.length; i++) {
      const fb = SAMPLE_FEEDBACK[i];
      const categoryId = categoryMap[fb.category];
      
      // Alternate between admin and member as authors for non-anonymous feedback
      const userId = fb.is_anonymous ? null : (i % 2 === 0 ? adminId : memberId);
      
      // Stagger creation dates over last 30 days
      const createdAt = new Date(now.getTime() - (i * 2 * 24 * 60 * 60 * 1000));
      
      await client.query(
        `INSERT INTO feedback 
         (user_id, message, category_id, sentiment_label, sentiment_score, is_anonymous, status, upvotes, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          fb.message,
          categoryId,
          fb.sentiment_label,
          fb.sentiment_score,
          fb.is_anonymous,
          fb.status,
          fb.upvotes,
          createdAt
        ]
      );
    }
    console.log('✅ Sample feedback seeded');
    
    // Add some votes for realism
    console.log('🗳️ Adding sample votes...');
    const feedbackResult = await client.query('SELECT id FROM feedback ORDER BY RANDOM() LIMIT 20');
    for (const fb of feedbackResult.rows) {
      // Randomly vote as member (not on own feedback)
      const canVote = await client.query(
        'SELECT user_id FROM feedback WHERE id = $1',
        [fb.id]
      );
      
      if (canVote.rows[0]?.user_id !== memberId) {
        await client.query(
          `INSERT INTO feedback_votes (feedback_id, user_id, vote_type) 
           VALUES ($1, $2, 'up') 
           ON CONFLICT (feedback_id, user_id) DO NOTHING`,
          [fb.id, memberId]
        );
      }
    }
    console.log('✅ Sample votes added');
    
    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Admin:  admin / ${ADMIN_PASSWORD}`);
    console.log(`   Member: member / ${MEMBER_PASSWORD}`);
    console.log('\n🔗 Access URLs:');
    console.log(`   Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`   Backend:  ${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/health`);
    
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

// Run seed
if (process.env.NODE_ENV === 'production') {
  console.error('🚫 ERROR: Seed script cannot run in production!');
  console.error('   This script is for development/testing only.');
  console.error('   Set NODE_ENV=development to proceed.');
  process.exit(1);
} else {
  seed();
}