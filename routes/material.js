const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

router.get('/:material/:spoolNumber', async (req, res) => {
  const { material, spoolNumber } = req.params;
  const fileName = `${material}-${String(spoolNumber).padStart(3, '0')}.json`;
  const filePath = path.join(__dirname, '..', 'Data', material, fileName);
  try {
    await fs.access(filePath);
    const fileData = await fs.readFile(filePath, 'utf8');
    const materialData = JSON.parse(fileData);
    res.render('material-details', { material, spoolNumber, data: materialData });
  } catch (err) {
    res.status(404).send('Rolgegevens niet gevonden.');
  }
});

module.exports = router;
