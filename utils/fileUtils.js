const fsSync = require('fs');
const path = require('path');

function ensureDirectoryExists(dirPath) {
  if (!fsSync.existsSync(dirPath)) {
    fsSync.mkdirSync(dirPath, { recursive: true });
  }
}

function getNextSpoolNumber(material) {
  const materialDir = path.join(__dirname, '..', 'Data', material);
  if (!fsSync.existsSync(materialDir)) {
    return 1;
  }
  const files = fsSync.readdirSync(materialDir);
  const spoolNumbers = files
    .filter(file => file.startsWith(material) && file.endsWith('.json'))
    .map(file => {
      const match = file.match(new RegExp(`${material}-(\\d+)\\.json`));
      return match ? parseInt(match[1]) : null;
    })
    .filter(number => !isNaN(number));
  return spoolNumbers.length > 0 ? Math.max(...spoolNumbers) + 1 : 1;
}

module.exports = {
  ensureDirectoryExists,
  getNextSpoolNumber
};
