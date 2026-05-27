import { Pool, Client } from 'pg';
import { config } from '@/config';
import { logger } from '@/logger';

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

export const initDB = async () => {
  try {
    // First, connect to the default 'postgres' database to check/create the target database
    const setupClient = new Client({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: 'postgres',
    });
    
    await setupClient.connect();
    
    const dbName = config.db.database || 'sleeptime-db';
    const res = await setupClient.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = $1`, [dbName]);
    
    if (res.rowCount === 0) {
      logger.info(`Database "${dbName}" not found, creating it...`);
      await setupClient.query(`CREATE DATABASE "${dbName}"`);
      logger.info(`Database "${dbName}" created successfully.`);
    }
    
    await setupClient.end();

    const client = await pool.connect();

    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'USER',
        refresh_token VARCHAR(255),
        reset_password_token VARCHAR(255),
        reset_password_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add refresh_token column if table already exists
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255);`);

    // Create xero_tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS xero_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        xero_invoice_id TEXT UNIQUE,
        user_id UUID REFERENCES users(id),
        customer_name TEXT,
        amount NUMERIC(10, 2),
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    client.release();
    logger.info('Database initialized and tables created successfully');
  } catch (error) {
    logger.error('Error initializing database: ' + error);
    process.exit(1);
  }
};
