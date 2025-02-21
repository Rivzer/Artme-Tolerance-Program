(() => {
    let historyChart;
    let running = false;
    let paused = false;
    let startTime;
    let elapsedTime = 0;
    let currentMaterial = null;
    let currentSpoolNumber = null;

    let latestMeasurementEl,
        highestMeasurementEl,
        lowestMeasurementEl,
        averageMeasurementEl,
        durationEl,
        materialSelectEl,
        spoolNumberEl,
        startButton,
        stopButton,
        resetButton,
        saveButton;

    const initChart = () => {
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
    };

    const calculateAverageDiameter = measurements => {
        if (measurements.length === 0) return '0.00';
        const sum = measurements.reduce((acc, measurement) => acc + measurement, 0);
        return (sum / measurements.length).toFixed(2);
    };

    const checkAlarm = async (measurement) => {
        try {
            const response = await fetch('/alarm/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ measurement })
            });
            const result = await response.json();
            if (result.success) {
                console.log('Alarm triggered!');
            }
        } catch (error) {
            console.error('Error checking alarm:', error);
        }
    };

    const updateMeasurement = async () => {
        try {
            const response = await fetch('/get-measurement');
            const data = await response.json();
    
            if (data.measurement !== null) {
                latestMeasurementEl.textContent = data.measurement.toFixed(2);
                highestMeasurementEl.textContent = Math.max(...data.measurements).toFixed(2);
                lowestMeasurementEl.textContent = Math.min(...data.measurements).toFixed(2);
                averageMeasurementEl.textContent = calculateAverageDiameter(data.measurements);
    
                historyChart.data.labels.push(new Date().toLocaleTimeString());
                historyChart.data.datasets[0].data.push(data.measurement);
    
                if (historyChart.data.labels.length > 50) {
                    historyChart.data.labels.shift();
                    historyChart.data.datasets[0].data.shift();
                }
    
                historyChart.update();
    
                checkAlarm(data.measurement);
            }
    
            running = data.isRunning;
            paused = data.isPaused;
            startTime = data.startTime;
            elapsedTime = data.elapsedTime;
    
            if (running && !paused) {
                updateDuration();
            }
    
            updateButtonStates();
        } catch (error) {
            console.error('Error fetching measurement:', error);
        }
    };

    const startMeasurement = async () => {
        try {
            await fetch('/start', { method: 'POST' });
            updateMeasurement();
            updateButtonStates();
            toggleMaterialDropdown();
        } catch (error) {
            console.error('Error starting measurement:', error);
        }
    };

    const stopMeasurement = async () => {
        try {
            await fetch('/stop', { method: 'POST' });
            updateMeasurement();
            updateButtonStates();
            toggleMaterialDropdown();
        } catch (error) {
            console.error('Error stopping measurement:', error);
        }
    };

    const resetMeasurement = async () => {
        try {
            await fetch('/reset', { method: 'POST' });
            historyChart.data.labels = [];
            historyChart.data.datasets[0].data = [];
            historyChart.update();
            latestMeasurementEl.textContent = 'N/A';
            averageMeasurementEl.textContent = 'N/A';
            highestMeasurementEl.textContent = 'N/A';
            lowestMeasurementEl.textContent = 'N/A';
            durationEl.textContent = '00:00:00';

            updateMeasurement();
            updateButtonStates();
            toggleMaterialDropdown();

            if (currentMaterial !== null) {
                const response = await fetch(`/get-next-spool/${currentMaterial}`);
                const result = await response.json();
                currentSpoolNumber = result.nextSpoolNumber;
                spoolNumberEl.textContent = currentSpoolNumber;
                updateButtonStates();

                await updateStateOnServer();
            }
        } catch (error) {
            console.error('Error resetting measurement:', error);
        }
    };

    const updateDuration = () => {
        if (running && !paused && startTime) {
            const elapsed = Date.now() - startTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            durationEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            setTimeout(updateDuration, 1000);
        }
    };

    const updateButtonStates = () => {
        if (currentMaterial) {
            startButton.disabled = running && !paused;
            stopButton.disabled = !running || paused;
            resetButton.disabled = !running;
            saveButton.disabled = historyChart.data.datasets[0].data.length === 0;
            startButton.textContent = (running && paused) ? 'Resume' : 'Start';
            toggleMaterialDropdown();
        } else {
            startButton.disabled = true;
            stopButton.disabled = true;
            resetButton.disabled = true;
            saveButton.disabled = true;
        }
    };

    const saveData = async () => {
        if (historyChart.data.datasets[0].data.length === 0) {
            alert('No data available to save.');
            return;
        }

        const measurements = historyChart.data.datasets[0].data;
        const averageDiameter = calculateAverageDiameter(measurements);

        const dataToSave = {
            material: currentMaterial,
            spoolNumber: currentSpoolNumber,
            measurements: measurements,
            timestamps: historyChart.data.labels,
            highest: highestMeasurementEl.textContent,
            lowest: lowestMeasurementEl.textContent,
            duration: durationEl.textContent,
            averageDiameter: averageDiameter
        };

        try {
            const response = await fetch('/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });
            const result = await response.json();
            if (result.success) {
                alert('Data saved successfully.');
                const qrCodeUrl = `/qr/${currentMaterial}/${currentSpoolNumber}`;
                console.log('Scan this QR code to view spool details:', qrCodeUrl);
            } else {
                alert('Error saving data.');
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Error saving data.');
        }
    };

    const toggleMaterialDropdown = () => {
        materialSelectEl.disabled = running || paused;
    };

    const onMaterialChange = async (e) => {
        const selectedMaterial = e.target.value;
        try {
            const response = await fetch(`/get-next-spool/${selectedMaterial}`);
            const result = await response.json();
            currentMaterial = selectedMaterial;
            currentSpoolNumber = result.nextSpoolNumber;
            spoolNumberEl.textContent = currentSpoolNumber;
            updateButtonStates();

            await updateStateOnServer();
        } catch (error) {
            console.error('Error fetching spool number:', error);
        }
    };

    const updateStateOnServer = async () => {
        try {
            await fetch('/update-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedMaterial: currentMaterial,
                    spoolNumber: currentSpoolNumber
                })
            });
        } catch (error) {
            console.error('Error updating server state:', error);
        }
    };

    const loadStateFromServer = async () => {
        try {
            const response = await fetch('/get-state');
            const state = await response.json();
            if (state.selectedMaterial && state.spoolNumber) {
                currentMaterial = state.selectedMaterial;
                currentSpoolNumber = state.spoolNumber;
                materialSelectEl.value = currentMaterial;
                spoolNumberEl.textContent = currentSpoolNumber;
                updateButtonStates();
            }
        } catch (error) {
            console.error('Error loading server state:', error);
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        latestMeasurementEl = document.getElementById('latest-measurement');
        highestMeasurementEl = document.getElementById('highest-measurement');
        lowestMeasurementEl = document.getElementById('lowest-measurement');
        averageMeasurementEl = document.getElementById('avarage-measurement');
        durationEl = document.getElementById('duration');
        materialSelectEl = document.getElementById('material-select');
        spoolNumberEl = document.getElementById('spool-number');
        startButton = document.querySelector('.start-btn');
        stopButton = document.querySelector('.stop-btn');
        resetButton = document.querySelector('.reset-btn');
        saveButton = document.querySelector('.save-btn');

        initChart();

        loadStateFromServer();

        materialSelectEl.addEventListener('change', onMaterialChange);
        startButton.addEventListener('click', startMeasurement);
        stopButton.addEventListener('click', stopMeasurement);
        resetButton.addEventListener('click', resetMeasurement);
        saveButton.addEventListener('click', saveData);

        setInterval(updateMeasurement, 1000);
    });
})();
