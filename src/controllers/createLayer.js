module.exports = function (app) {
  const { Layer } = app.get('dataModels');
  return async function (name) {
    const layer = await Layer.query().insert({
      name,
    });
    return layer;
  };
};
