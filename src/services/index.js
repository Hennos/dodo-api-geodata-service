const objects = require('./objects/objects.service.js');
const layers = require('./layers/layers.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(objects);
  app.configure(layers);
};
