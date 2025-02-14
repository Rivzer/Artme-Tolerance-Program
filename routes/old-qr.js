const express = require('express');
const qr = require('qr-image');
const router = express.Router();

router.get('/:material/:spoolNumber', (req, res) => {
  const { material, spoolNumber } = req.params;
  const url = `http://192.168.9.164/material/${material}/${spoolNumber}`;
  try {
    const qrCode = qr.image(url, { type: 'png' });
    res.type('png');
    qrCode.pipe(res);
  } catch (err) {
    res.status(500).send('QR code generatie mislukt.');
  }
});

module.exports = router;
