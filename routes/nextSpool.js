const express = require('express');
const router = express.Router();
const { getNextSpoolNumber } = require('../utils/fileUtils');

router.get('/get-next-spool/:material', (req, res) => {
  const material = req.params.material;
  const nextSpoolNumber = getNextSpoolNumber(material);
  res.json({ nextSpoolNumber });
});

module.exports = router;
