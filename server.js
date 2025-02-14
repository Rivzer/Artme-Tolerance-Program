const express = require('express');
const path = require('path');
const { loadData } = require('./utils/dataManager');

const app = express();
const port = 80;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const indexRouter = require('./routes/index');
const qrRouter = require('./routes/qr');
const materialRouter = require('./routes/material');
const measurementRouter = require('./routes/measurement');
const saveDataRouter = require('./routes/saveData');
const nextSpoolRouter = require('./routes/nextSpool');
const controlRouter = require('./routes/control');

app.use('/', indexRouter);
app.use('/qr', qrRouter);
app.use('/material', materialRouter);
app.use('/', measurementRouter);
app.use('/', saveDataRouter);
app.use('/', nextSpoolRouter);
app.use('/', controlRouter);

loadData().then(() => {
  app.listen(port, () => {
    console.log(`Server draait op http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Fout bij laden van data:', err);
});
