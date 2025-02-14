const express = require('express');
const router = express.Router();
const { getData, saveData } = require('../utils/dataManager');

router.get('/get-measurement', async (req, res) => {
  const data = getData();
  if (data.isRunning && !data.isPaused) {
    const newMeasurement = parseFloat(
      (Math.random() * (data.tolerance.max - data.tolerance.min) + data.tolerance.min).toFixed(2)
    );
    data.measurements.push(newMeasurement);
    if (data.measurements.length > 50) data.measurements.shift();
    await saveData();
  }
  res.json({
    measurement: data.measurements.length > 0 ? data.measurements[data.measurements.length - 1] : null,
    measurements: data.measurements,
    isRunning: data.isRunning,
    isPaused: data.isPaused,
    startTime: data.startTime,
    elapsedTime: data.elapsedTime
  });
});

module.exports = router;
