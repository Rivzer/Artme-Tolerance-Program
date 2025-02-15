const express = require('express');
const router = express.Router();
const { setLanguage } = require('../utils/languageManager');

router.post('/setLanguage', (req, res) => {
  const { language } = req.body;
  setLanguage(req, language);
  res.sendStatus(200);
});

module.exports = router;