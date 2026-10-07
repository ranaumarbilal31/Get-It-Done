require('dotenv').config();
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const schema = process.env.DATABASE_URL?.startsWith('postgres')
  ? 'prisma/schema.postgresql.prisma'
  : 'prisma/schema.prisma';
for (const args of [
  ['generate', '--schema', schema],
  ['db', 'push', '--skip-generate', '--schema', schema],
]) {
  const r = spawnSync(
    process.execPath,
    [path.resolve(__dirname, '../node_modules/prisma/build/index.js'), ...args],
    { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' },
  );
  if (r.status) process.exit(r.status);
}
require('./reconcile-payments.cjs')()
  .then(() => require('../src/server'))
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
