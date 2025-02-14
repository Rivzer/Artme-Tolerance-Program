const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { ensureDirectoryExists } = require('../utils/fileUtils');

router.post('/save-data', async (req, res) => {
  const { material, spoolNumber, measurements, timestamps, highest, lowest, duration, averageDiameter } = req.body;
  if (!material || !spoolNumber) {
    return res.status(400).json({ error: 'Materiaal en spoolnummer zijn vereist.' });
  }
  const materialDir = path.join(__dirname, '..', 'Data', material);
  ensureDirectoryExists(materialDir);
  const fileName = `${material}-${String(spoolNumber).padStart(3, '0')}.json`;
  const filePath = path.join(materialDir, fileName);
  const fileData = {
    material,
    spoolNumber,
    measurements,
    timestamps,
    highest,
    lowest,
    duration,
    averageDiameter
  };
  try {
    await fs.writeFile(filePath, JSON.stringify(fileData, null, 2), 'utf8');
    res.json({ success: true, message: 'Data succesvol opgeslagen.' });
  } catch (err) {
    res.status(500).json({ error: 'Opslaan van data mislukt.' });
  }
});

module.exports = router;
