module.exports = function (app) {
  app.set('dataModels', {
    Layer: require('./layer')(app),
    Object: require('./object')(app),
  });
};
