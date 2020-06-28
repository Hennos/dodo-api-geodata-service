module.exports = function (app) {
  const { Layer } = app.get('dataModels');
  return async function (id) {
    return await Layer.query().findById(id).withGraphFetched('objects');
  };
};
