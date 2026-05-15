import express from 'express';

import cors from 'cors';

import dotenv from 'dotenv';

import fs from 'fs';

import { Pool } from 'pg';

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL,

  ssl: {
    ca: fs
      .readFileSync(
        './certs/ca.pem',
        'utf8'
      ),

    rejectUnauthorized: false,
  },
});

app.get('/exercises', async (_, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM exercises
      ORDER BY name ASC
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: 'Failed to fetch exercises',
    });
  }
});

app.listen(3000, () => {
  console.log(
    'API running on port 3000'
  );
});