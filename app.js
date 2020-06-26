const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const config = require('config');

const objection = require('./objection');

const dataModels = require('./src/dataModels');

const app = express();

app.set('config', config);

objection(app);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

dataModels(app);

module.exports = app;
