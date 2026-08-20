import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Base de datos SQLite dedicada a los tests, separada de prisma/dev.db.
// Se recrea desde cero en cada corrida para partir de un estado limpio y
// mantener las migraciones siempre al día con schema.prisma.
const ROOT_DIR = path.resolve(__dirname, '../..');
const TEST_DB_PATH = path.resolve(ROOT_DIR, 'prisma/test.db');
const TEST_DATABASE_URL = 'file:./test.db';

export default function setup(): void {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.rmSync(TEST_DB_PATH);
  }

  execSync('npx prisma migrate deploy', {
    cwd: ROOT_DIR,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
