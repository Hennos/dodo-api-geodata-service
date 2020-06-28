module.exports = function (app) {
  const { Layer } = app.get('dataModels');
  return async function (id, objects) {
    await Layer.transaction(async (trx) => {
      const updateObjects = Layer.relatedQuery('objects', trx).for(id);
      objects.forEach(({ id, data }) => updateObjects.findById(id).patch({ data }));
      await updateObjects;
    });
    return await Layer.relatedQuery('objects')
      .for(id)
      .findByIds(objects.map(({ id }) => id));
  };
};
