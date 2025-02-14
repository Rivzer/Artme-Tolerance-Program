const express = require('express');
const router = express.Router();
const { getData, saveData } = require('../utils/dataManager');

router.post('/start', async (req, res) => {
  const data = getData();
  if (!data.isRunning || data.isPaused) {
    data.isRunning = true;
    data.isPaused = false;
    data.startTime = Date.now() - data.elapsedTime;
    await saveData();
  }
  res.sendStatus(200);
});

router.post('/stop', async (req, res) => {
  const data = getData();
  if (data.isRunning && !data.isPaused) {
    data.isPaused = true;
    data.elapsedTime = Date.now() - data.startTime;
    await saveData();
  }
  res.sendStatus(200);
});

router.post('/reset', async (req, res) => {
  const data = getData();
  data.measurements = [];
  data.isRunning = false;
  data.isPaused = false;
  data.startTime = null;
  data.elapsedTime = 0;
  await saveData();
  res.sendStatus(200);
});

module.exports = router;
