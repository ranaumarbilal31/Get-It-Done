const { spawnSync, spawn } = require('node:child_process');
const { mkdtempSync, rmSync, mkdirSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const root = resolve(__dirname, '../.test-data');
mkdirSync(root, { recursive: true });
const directory = mkdtempSync(join(root, 'browser-'));
const cwd = resolve(__dirname, '..');
writeFileSync(join(directory, 'test.db'), '');
const env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: 'file:../.test-data/' + directory.split(/[\\/]/).pop() + '/test.db',
  JWT_SECRET: 'isolated-browser-test-secret',
  SMTP_USER: '',
  SMTP_PASS: '',
  CLOUDINARY_CLOUD_NAME: '',
  CLOUDINARY_API_KEY: '',
  CLOUDINARY_API_SECRET: '',
  CLIENT_URL: 'http://localhost:5173',
  PORT: '5000',
};
for (const [script, args] of [
  ['node_modules/prisma/build/index.js', ['generate']],
  ['node_modules/prisma/build/index.js', ['db', 'push', '--skip-generate']],
  ['prisma/seed.js', []],
]) {
  const result = spawnSync(process.execPath, [resolve(cwd, script), ...args], {
    cwd,
    env,
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
const child = spawn(
  process.execPath,
  ['-e', "const {server}=require('./src/server.js');server.listen(5000,'127.0.0.1');"],
  { cwd, env, stdio: 'inherit' },
);
const stop = () => child.kill();
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
child.on('exit', (code) => {
  try {
    if (!resolve(directory).startsWith(root + require('node:path').sep))
      throw new Error('Invalid cleanup path');
    rmSync(directory, { recursive: true, force: true });
  } catch {}
  process.exit(code || 0);
});
