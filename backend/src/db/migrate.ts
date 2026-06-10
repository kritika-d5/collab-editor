import fs from 'fs';
import path from 'path';
import { pool } from './postgres';

export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      run_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const { rows } = await pool.query(
      'SELECT filename FROM _migrations WHERE filename = $1',
      [file]
    );
    if (rows.length > 0) continue;

    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
