const express = require('express');
const qr = require('qr-image');
const router = express.Router();

router.get('/:material/:spoolNumber', (req, res) => {
    const { material, spoolNumber } = req.params;
    const url = `${process.env.QR_BASE_URL}/material/${material}/${spoolNumber}`;

    try {
        const qrBuffer = qr.imageSync(url, { type: 'png' });
        const qrBase64 = qrBuffer.toString('base64');

        res.render('qr-page', { material, spoolNumber, qrCode: qrBase64 });
    } catch (err) {
        res.status(500).send('QR code generatie mislukt.');
    }
});

module.exports = router;