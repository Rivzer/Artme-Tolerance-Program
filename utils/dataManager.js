const fs = require('fs').promises;
const path = require('path');

const dataFilePath = path.join(__dirname, '..', 'data.json');

let data = null;

async function loadData() {
  try {
    const fileData = await fs.readFile(dataFilePath, 'utf8');
    data = JSON.parse(fileData);
  } catch (err) {
    data = {
      measurements: [],
      tolerance: { min: 1.70, max: 1.82 },
      isRunning: false,
      isPaused: false,
      startTime: null,
      elapsedTime: 0
    };
  }
  return data;
}

async function saveData() {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Fout bij opslaan van data:', err);
  }
}

function getData() {
  return data;
}

module.exports = {
  loadData,
  saveData,
  getData
};
