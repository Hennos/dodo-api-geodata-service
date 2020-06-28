module.exports = function (app) {
  const { Layer } = app.get('dataModels');
  return async function (id, objects) {
    return await Layer.relatedQuery('objects').for(id).findByIds(objects).delete().returning('*');
  };
};
