const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Pad naar het data-bestand
const dataFilePath = path.join(__dirname, 'data.json');

// Laad de data uit het bestand of maak een lege dataset aan
let data = loadData();

function loadData() {
    try {
        const fileData = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(fileData);
    } catch (err) {
        // Als het bestand niet bestaat, maak een nieuwe dataset aan
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

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index', { measurements: data.measurements, tolerance: data.tolerance });
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