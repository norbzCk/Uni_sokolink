const { config } = require('dotenv');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

config({ path: path.resolve(process.cwd(), '.env') });
const allowed = new Set([
  'identity', 'seller', 'catalogue', 'inventory', 'commerce', 'payment', 'fulfilment', 'notifications',
]);
const service = process.argv[2];
if (!allowed.has(service)) {
  console.error('Usage: node infra/scripts/migrate.js <service>');
  process.exit(2);
}
const password = process.env[service.toUpperCase() + '_DB_PASSWORD'];
if (!password) {
  console.error('Missing service database password in .env');
  process.exit(2);
}
const port = process.env.POSTGRES_PORT || '5432';
process.env.DATABASE_URL =
  'postgresql://' +
  service +
  '_owner:' +
  encodeURIComponent(password) +
  '@localhost:' +
  port +
  '/' +
  service +
  '_db?schema=public';
const schema = path.join('apps', service, 'prisma', 'schema.prisma');
const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['prisma', 'migrate', 'deploy', '--schema', schema],
  { stdio: 'inherit', env: process.env },
);
process.exit(result.status ?? 1);
