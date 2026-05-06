import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const certPath = path.resolve(process.cwd(), 'certs', 'ca.pem');

export const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '22943', 10),
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(certPath).toString(),
  },
});

// Catch pool errors so they don't crash the app silently
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// A quick helper function to verify the connection on startup
export const testDbConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to Aiven PostgreSQL database!');
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
  }
};