module.exports = function (app) {
  app.set('controllers', {
    getLayer: require('./getLayer')(app),
    getLayers: require('./getLayers')(app),
    createLayer: require('./createLayer')(app),
    createObject: require('./createObject')(app),
    updateObjects: require('./updateObjects')(app),
    removeObjects: require('./removeObjects')(app),
  });
};
