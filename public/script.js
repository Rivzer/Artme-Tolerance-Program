let historyChart;
let running = false;
let paused = false;
let startTime;
let elapsedTime = 0;
let currentMaterial = null;
let currentSpoolNumber = null;

function initChart() {
    const ctx = document.getElementById('historyChart').getContext('2d');
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Diameter (mm)',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 2,
                fill: false,
                pointRadius: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Time' } },
                y: { title: { display: true, text: 'Diameter (mm)' } }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function updateMeasurement() {
    fetch('/get-measurement')
        .then(response => response.json())
        .then(data => {
            if (data.measurement !== null) {
                document.getElementById('latest-measurement').textContent = data.measurement.toFixed(2);
                document.getElementById('highest-measurement').textContent = Math.max(...data.measurements).toFixed(2);
                document.getElementById('lowest-measurement').textContent = Math.min(...data.measurements).toFixed(2);

                const averageDiameter = calculateAverageDiameter(data.measurements);
                document.getElementById('avarage-measurement').textContent = averageDiameter;

                historyChart.data.labels.push(new Date().toLocaleTimeString());
                historyChart.data.datasets[0].data.push(data.measurement);

                if (historyChart.data.labels.length > 50) {
                    historyChart.data.labels.shift();
                    historyChart.data.datasets[0].data.shift();
                }

                historyChart.update();
            }

            running = data.isRunning;
            paused = data.isPaused;
            startTime = data.startTime;
            elapsedTime = data.elapsedTime;

            if (running && !paused) {
                updateDuration();
            }

            updateButtonStates();
        })
        .catch(error => console.error('Fout bij ophalen meting:', error));
}

function startMeasurement() {
    fetch('/start', { method: 'POST' })
        .then(() => {
            updateMeasurement();
            updateButtonStates();
            toggleMaterialDropdown();
        });
}

function stopMeasurement() {
    fetch('/stop', { method: 'POST' })
        .then(() => {
            updateMeasurement();
            updateButtonStates();
            toggleMaterialDropdown();
        });
}

function resetMeasurement() {
    fetch('/reset', { method: 'POST' })
        .then(() => {
            historyChart.data.labels = [];
            historyChart.data.datasets[0].data = [];
            historyChart.update();
            document.getElementById('latest-measurement').textContent = 'N/A';
            document.getElementById('avarage-measurement').textContent = 'N/A';
            document.getElementById('highest-measurement').textContent = 'N/A';
            document.getElementById('lowest-measurement').textContent = 'N/A';
            document.getElementById('duration').textContent = '00:00:00';
            updateMeasurement();
            updateButtonStates();
            toggleMaterialDropdown();

            if (currentMaterial !== null) {
                fetch(`/get-next-spool/${currentMaterial}`)
                    .then(response => response.json())
                    .then(data => {
                        currentSpoolNumber = data.nextSpoolNumber;
                        document.getElementById('spool-number').textContent = currentSpoolNumber;
                        updateButtonStates();

                        localStorage.setItem('currentSpoolNumber', currentSpoolNumber);
                    })
                    .catch(error => console.error('Fout bij ophalen spoolnummer:', error));
            }
        });
}

function updateDuration() {
    if (running && !paused && startTime) {
        const elapsed = Date.now() - startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        document.getElementById('duration').textContent =
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        setTimeout(updateDuration, 1000);
    }
}

function updateButtonStates() {
    const startButton = document.querySelector('.start-btn');
    const stopButton = document.querySelector('.stop-btn');
    const resetButton = document.querySelector('.reset-btn');
    const saveButton = document.querySelector('.save-btn');

    if (currentMaterial) {
        startButton.disabled = false;
        stopButton.disabled = !running || paused;
        resetButton.disabled = !running;
        saveButton.disabled = historyChart.data.datasets[0].data.length === 0;

        if (running && paused) {
            startButton.textContent = 'Resume';
        } else {
            startButton.textContent = 'Start';
        }

        if(running && !paused) startButton.disabled = true;

        toggleMaterialDropdown();
    } else {
        startButton.disabled = true;
        stopButton.disabled = true;
        resetButton.disabled = true;
        saveButton.disabled = true;
    }
}

function saveData() {
    if (historyChart.data.datasets[0].data.length === 0) {
        alert('Geen data beschikbaar om op te slaan.');
        return;
    }

    const measurements = historyChart.data.datasets[0].data;
    const sum = measurements.reduce((acc, measurement) => acc + measurement, 0);
    const averageDiameter = (sum / measurements.length).toFixed(2);

    const data = {
        material: currentMaterial,
        spoolNumber: currentSpoolNumber,
        measurements: historyChart.data.datasets[0].data,
        timestamps: historyChart.data.labels,
        highest: document.getElementById('highest-measurement').textContent,
        lowest: document.getElementById('lowest-measurement').textContent,
        duration: document.getElementById('duration').textContent,
        averageDiameter: averageDiameter
    };

    fetch('/save-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Data succesvol opgeslagen.');
            // Voeg een link toe naar de QR-code
            const qrCodeUrl = `/qr/${currentMaterial}/${currentSpoolNumber}`;
            console.log('Scan deze QR-code om de rolgegevens te bekijken:', qrCodeUrl);
        } else {
            alert('Fout bij opslaan van data.');
        }
    })
    .catch(error => {
        console.error('Fout bij opslaan van data:', error);
        alert('Fout bij opslaan van data.');
    });
}

function toggleMaterialDropdown() {
    const materialSelect = document.getElementById('material-select');
    materialSelect.disabled = running || paused;
}

function calculateAverageDiameter(measurements) {
    if (measurements.length === 0) return 0; // Als er geen metingen zijn, retourneer 0
    const sum = measurements.reduce((acc, measurement) => acc + measurement, 0);
    return (sum / measurements.length).toFixed(2); // Gemiddelde diameter met 2 decimalen
}

document.getElementById('material-select').addEventListener('change', function () {
    const selectedMaterial = this.value;

    fetch(`/get-next-spool/${selectedMaterial}`)
        .then(response => response.json())
        .then(data => {
            currentMaterial = selectedMaterial;
            currentSpoolNumber = data.nextSpoolNumber;
            document.getElementById('spool-number').textContent = currentSpoolNumber;
            updateButtonStates();

            localStorage.setItem('selectedMaterial', currentMaterial);
            localStorage.setItem('currentSpoolNumber', currentSpoolNumber);
        })
        .catch(error => console.error('Fout bij ophalen spoolnummer:', error));
});

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    setInterval(updateMeasurement, 2000);

    const savedMaterial = localStorage.getItem('selectedMaterial');
    const savedSpoolNumber = localStorage.getItem('currentSpoolNumber');

    if (savedMaterial && savedSpoolNumber) {
        currentMaterial = savedMaterial;
        currentSpoolNumber = parseInt(savedSpoolNumber);

        const materialSelect = document.getElementById('material-select');
        materialSelect.value = currentMaterial;

        document.getElementById('spool-number').textContent = currentSpoolNumber;

        setTimeout(() => {
            updateButtonStates();
        }, 2000);
    }

    document.querySelector('.start-btn').addEventListener('click', startMeasurement);
    document.querySelector('.stop-btn').addEventListener('click', stopMeasurement);
    document.querySelector('.reset-btn').addEventListener('click', resetMeasurement);
    document.querySelector('.save-btn').addEventListener('click', saveData);
});