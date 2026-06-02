import dotenv from 'dotenv';
dotenv.config();

import { getPool } from './infrastructure/database/connection';
import { createApp } from './presentation/server';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

async function main(): Promise<void> {
  const pool = getPool();

  // Verify DB connection
  await pool.query('SELECT 1');
  console.log('Database connected.');

  const app = createApp(pool);

  app.listen(PORT, () => {
    console.log(`API server listening on http://0.0.0.0:${PORT}`);
  });
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
