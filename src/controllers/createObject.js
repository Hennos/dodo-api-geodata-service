module.exports = function (app) {
  const { Layer } = app.get('dataModels');
  return async function (id, object) {
    return await Layer.relatedQuery('objects').for(id).insert(object).returning('*');
  };
};
