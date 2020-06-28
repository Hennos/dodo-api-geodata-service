// const app = require('../app');

// const { getLayer, createObject, updateObjects, removeObjects } = app.get('controllers');

// const layerId = '1';
// const createdFeature = {
//   type: 'Feature',
//   geometry: {
//     type: 'LineString',
//     coordinates: [
//       [102.0, 0.0],
//       [103.0, 1.0],
//       [104.0, 1.0],
//       [105.0, 1.0],
//     ],
//   },
// };
// const updatedFeature = {
//   type: 'Feature',
//   geometry: {
//     type: 'LineString',
//     coordinates: [
//       [102.0, 0.0],
//       [103.0, 1.0],
//     ],
//   },
// };

// getLayer(layerId)
//   .then((found) => {
//     console.log(found);
//     return createObject(layerId, {
//       data: createdFeature,
//     });
//   })
//   .then((created) => {
//     console.log(created);
//     return updateObjects(layerId, [
//       {
//         id: created.id,
//         data: updatedFeature,
//       },
//     ]);
//   })
//   .then((updated) => {
//     console.log(updated);
//     return removeObjects(
//       layerId,
//       updated.map(({ id }) => id),
//     );
//   })
//   .then((deleted) => {
//     console.log(deleted);
//     return getLayer(layerId);
//   })
//   .then((result) => console.log(result))
//   .catch((error) => console.log(error));
