/**
 * Database Service
 * PostgreSQL connection and query management
 */

import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool | null = null;
  
  private constructor() {}
  
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  async initialize(): Promise<void> {
    try {
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'genesis_music',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      logger.info('Database connection established');
      
      // Create tables if not exists
      await this.createTables();
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }
  
  async createTables(): Promise<void> {
    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar VARCHAR(500),
        role VARCHAR(50) DEFAULT 'user',
        preferences JSONB DEFAULT '{}',
        subscription JSONB DEFAULT '{"plan": "free"}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Scores table
      `CREATE TABLE IF NOT EXISTS scores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255),
        composer VARCHAR(255),
        genre VARCHAR(100),
        key_signature VARCHAR(10),
        time_signature VARCHAR(10),
        tempo INTEGER,
        measures JSONB NOT NULL,
        tab_data JSONB,
        audio_url VARCHAR(500),
        midi_url VARCHAR(500),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Practice sessions table
      `CREATE TABLE IF NOT EXISTS practice_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        score_id UUID REFERENCES scores(id) ON DELETE CASCADE,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        duration_minutes INTEGER,
        tempo_changes JSONB DEFAULT '[]',
        sections_practiced JSONB DEFAULT '[]',
        accuracy_score DECIMAL(5,2),
        notes JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Transcription jobs table
      `CREATE TABLE IF NOT EXISTS transcription_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        source_type VARCHAR(50) NOT NULL,
        source_url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        options JSONB DEFAULT '{}',
        result_score_id UUID REFERENCES scores(id),
        error_message TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_scores_genre ON scores(genre)`,
      `CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_practice_sessions_score_id ON practice_sessions(score_id)`,
      `CREATE INDEX IF NOT EXISTS idx_transcription_jobs_user_id ON transcription_jobs(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_transcription_jobs_status ON transcription_jobs(status)`
    ];
    
    for (const query of queries) {
      try {
        await this.query(query);
      } catch (error) {
        logger.error(`Failed to execute query: ${query}`, error);
      }
    }
  }
  
  async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      logger.error('Database query error:', { text, params, error });
      throw error;
    }
  }
  
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    
    return this.pool.connect();
  }
  
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('Database connection closed');
    }
  }
}