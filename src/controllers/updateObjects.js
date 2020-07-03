module.exports = function (app) {
  const { Layer } = app.get('dataModels');
  return async function (id, objects) {
    // TODO: Есть подозрение, что можно обойтись без upsertGraph
    const result = await Layer.query().upsertGraph(
      {
        id,
        objects,
      },
      {
        noInsert: true,
        noDelete: true,
      },
    );
    return result.objects;
  };
};
