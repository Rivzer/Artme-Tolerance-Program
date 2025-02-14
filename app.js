const express = require('express');
const fs = require('fs');
const path = require('path');
const qr = require('qr-image');
const app = express();
const port = 3000;

const dataFilePath = path.join(__dirname, 'data.json');

let data = loadData();

function loadData() {
    try {
        const fileData = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(fileData);
    } catch (err) {
        return {
            measurements: [],
            tolerance: { min: 1.70, max: 1.82 },
            isRunning: false,
            isPaused: false,
            startTime: null,
            elapsedTime: 0
        };
    }
}

function saveData() {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
}

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function getNextSpoolNumber(material) {
    const materialDir = path.join(__dirname, 'Data', material);

    if (!fs.existsSync(materialDir)) {
        return 1;
    }

    const files = fs.readdirSync(materialDir);

    const spoolNumbers = files
        .filter(file => file.startsWith(material) && file.endsWith('.json'))
        .map(file => {
            const match = file.match(new RegExp(`${material}-(\\d+)\\.json`));
            return match ? parseInt(match[1]) : null;
        })
        .filter(number => !isNaN(number));

    return spoolNumbers.length > 0 ? Math.max(...spoolNumbers) + 1 : 1;
}

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index', { measurements: data.measurements, tolerance: data.tolerance });
});

app.get('/qr/:material/:spoolNumber', (req, res) => {
    const { material, spoolNumber } = req.params;
    const url = `http://localhost:${port}/material/${material}/${spoolNumber}`;
    const qrCode = qr.image(url, { type: 'png' });
    res.type('png');
    qrCode.pipe(res);
});

app.get('/material/:material/:spoolNumber', (req, res) => {
    const { material, spoolNumber } = req.params;
    const filePath = path.join(__dirname, 'Data', material, `${material}-${String(spoolNumber).padStart(3, '0')}.json`);

    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.render('material-details', { material, spoolNumber, data });
    } else {
        res.status(404).send('Rolgegevens niet gevonden.');
    }
});

app.get('/get-measurement', (req, res) => {
    if (data.isRunning && !data.isPaused) {
        let newMeasurement = parseFloat((Math.random() * (data.tolerance.max - data.tolerance.min) + data.tolerance.min).toFixed(2));
        data.measurements.push(newMeasurement);
        if (data.measurements.length > 50) data.measurements.shift();
        saveData();
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

app.post('/save-data', (req, res) => {
    const { material, spoolNumber, measurements, timestamps, highest, lowest, duration, averageDiameter } = req.body;

    if (!material || !spoolNumber) {
        return res.status(400).json({ error: 'Materiaal en spoolnummer zijn vereist.' });
    }

    const materialDir = path.join(__dirname, 'Data', material);
    ensureDirectoryExists(materialDir);

    const fileName = `${material}-${String(spoolNumber).padStart(3, '0')}.json`;
    const filePath = path.join(materialDir, fileName);

    const data = {
        material,
        spoolNumber,
        measurements,
        timestamps,
        highest,
        lowest,
        duration,
        averageDiameter
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    res.json({ success: true, message: 'Data succesvol opgeslagen.' });
});

app.get('/get-next-spool/:material', (req, res) => {
    const material = req.params.material;
    const nextSpoolNumber = getNextSpoolNumber(material);
    res.json({ nextSpoolNumber });
});

app.post('/start', (req, res) => {
    if (!data.isRunning) {
        data.isRunning = true;
        data.isPaused = false;
        data.startTime = Date.now() - data.elapsedTime;
        saveData();
    } else if (data.isPaused) {
        data.isPaused = false;
        data.startTime = Date.now() - data.elapsedTime;
        saveData();
    }
    res.sendStatus(200);
});

app.post('/stop', (req, res) => {
    if (data.isRunning && !data.isPaused) {
        data.isPaused = true;
        data.elapsedTime = Date.now() - data.startTime;
        saveData();
    }
    res.sendStatus(200);
});

app.post('/reset', (req, res) => {
    data.measurements = [];
    data.isRunning = false;
    data.isPaused = false;
    data.startTime = null;
    data.elapsedTime = 0;
    saveData();
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server draait op http://localhost:${port}`);
});