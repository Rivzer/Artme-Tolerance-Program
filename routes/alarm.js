const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

let buzzer;
if (process.env.USE_RPI_BUZZER === 'true' && process.platform === 'linux') {
    const { Gpio } = require('onoff');
    const BUZZER_PIN = parseInt(process.env.BUZZER_PIN, 10);
    buzzer = new Gpio(BUZZER_PIN, 'out');
} else if (process.env.USE_RPI_BUZZER === 'true') {
    console.warn('GPIO is not supported on this platform. Buzzer will not work.');
}

const TOLERANCE = JSON.parse(process.env.TOLERANCE).map(Number);

let alarmStatus = false;
let lastAlarmMeasurement = null;
let lastAlarmTimestamp = null;

router.post('/check', async (req, res) => {
    const { measurement } = req.body;

    if (typeof measurement !== 'number' || isNaN(measurement)) {
        return res.status(400).json({ success: false, message: 'Invalid measurement' });
    }

    if (process.env.ALARM_ON_TOLLERANCE_OVERRIDE !== 'true') {
        return res.json({ success: false, message: 'Alarm override is disabled' });
    }

    if (measurement < TOLERANCE[0] || measurement > TOLERANCE[1]) {
        alarmStatus = true;
        lastAlarmMeasurement = measurement;
        lastAlarmTimestamp = new Date().toISOString();

        exec('aplay /usr/share/sounds/alsa/Front_Center.wav', (error) => {
            if (error) {
                console.error('Error playing alarm sound:', error);
                return res.status(500).json({ success: false, message: 'Failed to trigger alarm sound' });
            }
            console.log('Alarm sound triggered!');
        });

        if (process.env.USE_RPI_BUZZER === 'true' && buzzer) {
            buzzer.writeSync(1);
            console.log('Buzzer turned on');
        }

        return res.json({ success: true, message: 'Alarm triggered' });
    } else {
        alarmStatus = false;

        if (process.env.USE_RPI_BUZZER === 'true' && buzzer) {
            buzzer.writeSync(0);
            console.log('Buzzer turned off');
        }

        return res.json({ success: false, message: 'Measurement within tolerance' });
    }
});

router.get('/status', (req, res) => {
    res.json({
        alarmTriggered: alarmStatus,
        lastAlarmMeasurement,
        lastAlarmTimestamp
    });
});

process.on('SIGINT', () => {
    if (buzzer) {
        buzzer.unexport();
        console.log('Buzzer GPIO pin cleaned up');
    }
});

module.exports = router;