module.exports = function (app) {
  require('./consumer')(app);
  require('./producer')(app);
};
