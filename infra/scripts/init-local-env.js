const { randomBytes } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const target = path.join(root, '.env');
if (fs.existsSync(target)) {
  console.error('.env already exists; leaving it unchanged.');
  process.exit(1);
}
let contents = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const value = () => randomBytes(32).toString('hex');
const secrets = {
  POSTGRES_PASSWORD: value(),
  RABBITMQ_PASSWORD: value(),
  ACCESS_TOKEN_SIGNING_KEY: value(),
  IDENTITY_DB_PASSWORD: value(),
  SELLER_DB_PASSWORD: value(),
  CATALOGUE_DB_PASSWORD: value(),
  INVENTORY_DB_PASSWORD: value(),
  COMMERCE_DB_PASSWORD: value(),
  PAYMENT_DB_PASSWORD: value(),
  FULFILMENT_DB_PASSWORD: value(),
  NOTIFICATIONS_DB_PASSWORD: value(),
};
for (const [key, secret] of Object.entries(secrets)) {
  contents = contents.replace(new RegExp('^' + key + '=.*$', 'm'), key + '=' + secret);
}
contents = contents.replace(
  /^AMQP_URL=.*$/m,
  'AMQP_URL=amqp://sokolink_local:' + secrets.RABBITMQ_PASSWORD + '@localhost:5672',
);
fs.writeFileSync(target, contents, { mode: 0o600, flag: 'wx' });
console.log('Created .env with unique local-only credentials (mode 0600).');
