module.exports = function (app) {
  const { Layer } = app.get('dataModels');
  return async function () {
    return await Layer.query().returning(['id', 'name']);
  };
};
