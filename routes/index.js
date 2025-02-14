const express = require('express');
const router = express.Router();
const { getData } = require('../utils/dataManager');

router.get('/', (req, res) => {
  const data = getData();
  res.render('index', { measurements: data.measurements, tolerance: data.tolerance });
});

module.exports = router;
