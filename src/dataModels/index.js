const createLayersModel = require('./layers');
const createObjectsModel = require('./objects');

module.exports = function (app) {
  app.set('dataModels', {
    layers: createLayersModel(app),
    objects: createObjectsModel(app),
  });
};
