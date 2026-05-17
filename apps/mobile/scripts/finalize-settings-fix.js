/*
 * Moves accidental backup route files out of app/(tabs) so Expo Router
 * does not register them as screens.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const tabsDir = path.join(projectRoot, 'app', '(tabs)');
const backupDir = path.join(projectRoot, 'route-backups');

if (!fs.existsSync(tabsDir)) {
  console.log('No app/(tabs) folder found. Run this from apps/mobile.');
  process.exit(0);
}

fs.mkdirSync(backupDir, { recursive: true });

const backupPatterns = [
  'settings.backup.tsx',
  'settings.crashing.tsx',
  'settings.old.tsx',
  'settings.test.tsx',
];

for (const fileName of backupPatterns) {
  const source = path.join(tabsDir, fileName);
  const target = path.join(backupDir, fileName);

  if (fs.existsSync(source)) {
    fs.renameSync(source, target);
    console.log(`Moved ${source} -> ${target}`);
  }
}

console.log('Settings route cleanup complete.');
