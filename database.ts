import 'dotenv/config';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

export const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_MAX || 10),
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    })
  : null;

export async function initializeDatabase<T>(initialState: T): Promise<T> {
  if (!pool) {
    throw new Error('DATABASE_URL is required to start the application.');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY,
      state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const result = await pool.query<{ state: T }>(
    'SELECT state FROM app_state WHERE id = 1'
  );

  if (result.rowCount === 0) {
    await pool.query(
      'INSERT INTO app_state (id, state) VALUES (1, $1::jsonb)',
      [JSON.stringify(initialState)]
    );
    return initialState;
  }

  return result.rows[0].state;
}

export async function persistDatabase<T>(state: T): Promise<void> {
  if (!pool) {
    throw new Error('DATABASE_URL is required to persist application data.');
  }

  await pool.query(
    'UPDATE app_state SET state = $1::jsonb, updated_at = NOW() WHERE id = 1',
    [JSON.stringify(state)]
  );
}

export async function closeDatabase(): Promise<void> {
  if (!pool) {
    return;
  }

  await pool.end();
}
