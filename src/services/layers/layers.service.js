// Initializes the `layers` service on path `/layers`
const { Layers } = require('./layers.class');
const createModel = require('../../models/layers.model');
const hooks = require('./layers.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    whitelist: ['$eager'],
    allowedEager: '[objects]',
  };

  // Initialize our service with any options it requires
  app.use('/layers', new Layers(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('layers');

  service.hooks(hooks);
};
