const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync, mkdirSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const root = resolve(__dirname, '../.test-data');
mkdirSync(root, { recursive: true });
const directory = mkdtempSync(join(root, 'tests-'));
writeFileSync(join(directory, 'test.db'), '');
const env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: 'file:../.test-data/' + directory.split(/[\\/]/).pop() + '/test.db',
  JWT_SECRET: 'isolated-test-secret-not-for-production',
  SMTP_USER: '',
  SMTP_PASS: '',
  CLOUDINARY_CLOUD_NAME: '',
  CLOUDINARY_API_KEY: '',
  CLOUDINARY_API_SECRET: '',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
};
const run = (script, args) => {
  const result = spawnSync(process.execPath, [resolve(script), ...args], {
    cwd: resolve(__dirname, '..'),
    env,
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error('Command failed: ' + script);
};
try {
  run('node_modules/prisma/build/index.js', ['generate']);
  run('node_modules/prisma/build/index.js', ['db', 'push', '--skip-generate']);
  run('prisma/seed.js', []);
  run('node_modules/vitest/vitest.mjs', ['run', '--no-file-parallelism']);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (!resolve(directory).startsWith(root + require('node:path').sep))
    throw new Error('Invalid cleanup path');
  rmSync(directory, { recursive: true, force: true });
}
