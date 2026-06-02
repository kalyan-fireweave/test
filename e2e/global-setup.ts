import { execSync } from 'child_process';
import path from 'path';

async function globalSetup(): Promise<void> {
  const ROOT = path.resolve(__dirname, '..');
  const dbUrl =
    process.env.DATABASE_URL ?? 'postgres://test_user:test_password@localhost:5433/notes_test_db';

  execSync('npm run migrate -w packages/api', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
  });
}

export default globalSetup;
