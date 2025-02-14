let historyChart;
let running = false;
let paused = false;
let startTime;
let elapsedTime = 0;

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
        });
}

function stopMeasurement() {
    fetch('/stop', { method: 'POST' })
        .then(() => {
            updateMeasurement();
        });
}

function resetMeasurement() {
    fetch('/reset', { method: 'POST' })
        .then(() => {
            historyChart.data.labels = [];
            historyChart.data.datasets[0].data = [];
            historyChart.update();
            document.getElementById('latest-measurement').textContent = 'N/A';
            document.getElementById('highest-measurement').textContent = 'N/A';
            document.getElementById('lowest-measurement').textContent = 'N/A';
            document.getElementById('duration').textContent = '00:00:00';
            updateMeasurement();
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

    if (paused) {
        startButton.textContent = 'Resume';
        stopButton.disabled = true;
    } else if (running) {
        startButton.textContent = 'Start';
        stopButton.disabled = false;
    } else {
        startButton.textContent = 'Start';
        stopButton.disabled = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    setInterval(updateMeasurement, 2000);

    document.querySelector('.start-btn').addEventListener('click', startMeasurement);
    document.querySelector('.stop-btn').addEventListener('click', stopMeasurement);
    document.querySelector('.reset-btn').addEventListener('click', resetMeasurement);
});