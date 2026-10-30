const fs = require('fs');
const path = require('path');
const { initStore, read, provider } = require('./store');

async function backup() {
  await initStore();
  const snapshot = { exportedAt: new Date().toISOString(), storage: provider(), data: await read() };
  const dir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const filename = `wareboss-${snapshot.exportedAt.replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(snapshot, null, 2));
  console.log(`Backup created: ${path.join(dir, filename)}`);
}
backup().catch(error => { console.error('Backup failed:', error.message); process.exit(1); });
