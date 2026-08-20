import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    passWithNoTests: true,
    globalSetup: ['tests/setup/global-setup.ts'],
    // Todos los tests comparten una única SQLite de test (prisma/test.db);
    // correr archivos en paralelo produce carreras entre resetDb() y las
    // inserciones de otro archivo. Se ejecutan en serie a cambio de aislamiento.
    fileParallelism: false,
    // Aislada de cualquier .env local o del DATABASE_URL de desarrollo:
    // los tests siempre corren contra prisma/test.db.
    env: {
      DATABASE_URL: 'file:./test.db',
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1h',
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
