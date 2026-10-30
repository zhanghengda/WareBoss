const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const dataFile = path.join(__dirname, 'data.json');
const seedFile = path.join(__dirname, 'seed.json');
const connectionString = process.env.DATABASE_URL;
let pool;

function localRead() {
  if (!fs.existsSync(dataFile)) fs.copyFileSync(seedFile, dataFile);
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}
function localSave(data) { fs.writeFileSync(dataFile, JSON.stringify(data, null, 2)); }

async function initStore() {
  if (!connectionString) return { provider: 'local-file' };
  pool = new Pool({ connectionString, ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false } });
  await pool.query(`CREATE TABLE IF NOT EXISTS wareboss_state (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const existing = await pool.query('SELECT id FROM wareboss_state WHERE id = 1');
  if (!existing.rowCount) await pool.query('INSERT INTO wareboss_state (id, payload) VALUES (1, $1::jsonb)', [JSON.stringify(localRead())]);
  return { provider: 'postgresql' };
}

async function read() {
  if (!pool) return localRead();
  const result = await pool.query('SELECT payload FROM wareboss_state WHERE id = 1');
  return result.rows[0].payload;
}
async function save(data) {
  if (!pool) return localSave(data);
  await pool.query('UPDATE wareboss_state SET payload = $1::jsonb, updated_at = NOW() WHERE id = 1', [JSON.stringify(data)]);
}
async function mutate(updater) {
  if (!pool) {
    const data = localRead();
    const result = updater(data);
    localSave(data);
    return result;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const selected = await client.query('SELECT payload FROM wareboss_state WHERE id = 1 FOR UPDATE');
    const data = selected.rows[0].payload;
    const result = updater(data);
    await client.query('UPDATE wareboss_state SET payload = $1::jsonb, updated_at = NOW() WHERE id = 1', [JSON.stringify(data)]);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
function provider() { return pool ? 'postgresql' : 'local-file'; }

module.exports = { initStore, read, save, mutate, provider };
