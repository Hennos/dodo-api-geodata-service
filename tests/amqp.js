// const amqp = require('amqplib');

// function generateUuid() {
//   return Math.random().toString() + Math.random().toString() + Math.random().toString();
// }

// module.exports = function (app) {
//   const {
//     amqp: { connection: url },
//   } = app.get('config');

//   const queues = {
//     GET_LAYER: 'get_geodata_layer',
//     GET_LAYERS: 'get_geodata_layers',
//     CREATE_OBJECT: 'create_geodata_object',
//     UPDATE_OBJECTS: 'update_geodata_objects',
//     REMOVE_OBJECTS: 'remove_geodata_objects',
//     LAYER_UPDATED: 'geodata_layer_updated',
//   };

//   amqp.connect(url).then((connection) => {
//     connection
//       .createChannel()
//       .then((channel) => {
//         const content = JSON.stringify({
//           layerId: '1',
//           created: {
//             type: 'Feature',
//             geometry: {
//               type: 'LineString',
//               coordinates: [
//                 [102.0, 0.0],
//                 [103.0, 1.0],
//                 [104.0, 1.0],
//                 [105.0, 1.0],
//               ],
//             },
//           },
//         });
//         channel.assertQueue(queues.CREATE_OBJECT, { durable: false });
//         channel.sendToQueue(queues.CREATE_OBJECT, Buffer.from(content));

//         const content = JSON.stringify({
//           layerId: '1',
//           updated: [
//             {
//               id: '11',
//               data: {
//                 type: 'Feature',
//                 geometry: {
//                   type: 'LineString',
//                   coordinates: [
//                     [102.0, 0.0],
//                     [103.0, 1.0],
//                   ],
//                 },
//               },
//             },
//           ],
//         });
//         channel.assertQueue(queues.UPDATE_OBJECTS, { durable: false });
//         channel.sendToQueue(queues.UPDATE_OBJECTS, Buffer.from(content));

//         content = JSON.stringify({
//           layerId: '1',
//           removed: ['11'],
//         });
//         channel.assertQueue(queues.REMOVE_OBJECTS, { durable: false });
//         channel.sendToQueue(queues.REMOVE_OBJECTS, Buffer.from(content));

//         setTimeout(function () {
//           connection.close();
//         }, 500);
//       })
//       .catch((error) => {
//         throw error;
//       });
//     connection
//       .createChannel()
//       .then((channel) => {
//         const exchange = 'updated_geodata_layer';
//         channel.assertExchange(exchange, 'fanout', { durable: false });
//         channel
//           .assertQueue('', { exclusive: true })
//           .then(({ queue }) => {
//             channel.bindQueue(queue, exchange, '');
//             channel.consume(
//               queue,
//               (message) => {
//                 if (message.content) {
//                   const updated = JSON.parse(message.content.toString());
//                   console.log(`Layer ${updated.id} is updated`);
//                 }
//               },
//               {
//                 noAck: true,
//               },
//             );
//           })
//           .catch((error) => {
//             throw error;
//           });
//       })
//       .catch((error) => {
//         throw error;
//       });
//   });
// };
