require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { loadData } = require('./utils/dataManager');

const app = express();

const port = process.env.PORT;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'secretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 2 * 60 * 60 * 1000 }
}));

const indexRouter = require('./routes/index');
const qrRouter = require('./routes/qr');
const materialRouter = require('./routes/material');
const measurementRouter = require('./routes/measurement');
const saveDataRouter = require('./routes/saveData');
const nextSpoolRouter = require('./routes/nextSpool');
const controlRouter = require('./routes/control');
const loginRoute = require('./routes/login');

app.use('/', indexRouter);
app.use('/qr', qrRouter);
app.use('/material', materialRouter);
app.use('/', measurementRouter);
app.use('/', saveDataRouter);
app.use('/', nextSpoolRouter);
app.use('/', controlRouter);
app.use('/', loginRoute);

loadData().then(() => {
  app.listen(port, () => {
    console.log(`Server draait op http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Fout bij laden van data:', err);
});
