const amqp = require('amqplib');

function getTableCenter(coordinates) {
  let twoTimesSignedArea = 0;
  let cxTimes6SignedArea = 0;
  let cyTimes6SignedArea = 0;

  const length = coordinates.length;

  const x = (i) => coordinates[i % length][0];
  const y = (i) => coordinates[i % length][1];

  for (let i = 0; i < length; i++) {
    const twoSA = x(i) * y(i + 1) - x(i + 1) * y(i);
    twoTimesSignedArea += twoSA;
    cxTimes6SignedArea += (x(i) + x(i + 1)) * twoSA;
    cyTimes6SignedArea += (y(i) + y(i + 1)) * twoSA;
  }
  const sixSignedArea = 3 * twoTimesSignedArea;
  return [cxTimes6SignedArea / sixSignedArea, cyTimes6SignedArea / sixSignedArea];
}

module.exports = async function (app) {
  const {
    amqp: { connection: url },
  } = app.get('config');

  const queues = {
    GET_LAYER: 'get_geodata_layer',
    GET_LAYERS: 'get_geodata_layers',
    CREATE_OBJECT: 'create_geodata_object',
    UPDATE_OBJECTS: 'update_geodata_objects',
    REMOVE_OBJECTS: 'remove_geodata_objects',
    TABLE_CHANGED_NOTIFICATION: 'robot_delivery_order',
  };

  const exchanges = {
    UPDATED_LAYER: 'updated_geodata_layer',
  };

  const updateActions = {
    CREATE_OBJECT: 'CREATE_OBJECT',
    UPDATE_OBJECTS: 'UPDATE_OBJECTS',
    REMOVE_OBJECTS: 'REMOVE_OBJECTS',
  };

  amqp.connect(url).then((connection) => {
    getLayerHandler(connection);
    getLayersHandler(connection);
    createObjectHandler(connection);
    updateObjectsHandler(connection);
    removeObjectsHandler(connection);
  });

  function getLayerHandler(connection) {
    const { getLayer } = app.get('controllers');
    return connection
      .createChannel()
      .then((channel) => {
        channel.assertQueue(queues.GET_LAYER, { durable: false });
        channel.prefetch(1);

        return channel.consume(queues.GET_LAYER, handleMessage);

        async function handleMessage(message) {
          console.log(`get_geodata_layer`);
          const request = JSON.parse(message.content.toString());
          const foundLayer = await getLayer(request.id);
          const resData = Buffer.from(JSON.stringify(foundLayer));
          channel.sendToQueue(message.properties.replyTo, resData, {
            correlationId: message.properties.correlationId,
          });
          channel.ack(message);
        }
      })
      .catch((error) => {
        throw error;
      });
  }
  function getLayersHandler(connection) {
    const { getLayers } = app.get('controllers');
    return connection
      .createChannel()
      .then((channel) => {
        channel.assertQueue(queues.GET_LAYERS, { durable: false });
        channel.prefetch(1);

        return channel.consume(queues.GET_LAYERS, handleMessage);

        async function handleMessage(message) {
          console.log(`get_geodata_layers request`);
          const foundLayers = await getLayers();
          const resData = Buffer.from(JSON.stringify(foundLayers));
          channel.sendToQueue(message.properties.replyTo, resData, {
            correlationId: message.properties.correlationId,
          });
          channel.ack(message);
        }
      })
      .catch((error) => {
        throw error;
      });
  }

  function createObjectHandler(connection) {
    const { createObject } = app.get('controllers');
    return connection
      .createChannel()
      .then((channel) => {
        channel.assertQueue(queues.CREATE_OBJECT, { durable: false });
        channel.prefetch(1);

        return channel.consume(queues.CREATE_OBJECT, handleMessage, { noAck: false });

        async function handleMessage(message) {
          console.log(`create_geodata_object request`);
          const request = JSON.parse(message.content.toString());
          const result = await createObject(request.layerId, { data: request.created });
          console.log(`create object ${result.id}`);

          const notification = JSON.stringify({
            id: request.layerId,
            action: updateActions.CREATE_OBJECT,
            data: result,
          });
          channel.assertExchange(exchanges.UPDATED_LAYER, 'fanout', { durable: false });
          channel.publish(exchanges.UPDATED_LAYER, '', Buffer.from(notification));

          const tableCenter = getTableCenter(result.data.geometry.coordinates[0]);
          console.log(`push table center at {${tableCenter[0]},${tableCenter[1]}}`);

          const tablesNotification = `t:${result.id},a:create,x:${tableCenter[0]},y:${tableCenter[1]}`;
          channel.assertQueue(queues.TABLE_CHANGED_NOTIFICATION, { durable: false });
          channel.sendToQueue(queues.TABLE_CHANGED_NOTIFICATION, Buffer.from(tablesNotification));

          channel.ack(message);
        }
      })
      .catch((error) => {
        throw error;
      });
  }
  function updateObjectsHandler(connection) {
    const { updateObjects } = app.get('controllers');
    return connection
      .createChannel()
      .then((channel) => {
        channel.assertQueue(queues.UPDATE_OBJECTS, { durable: false });
        channel.prefetch(1);
        return channel.consume(queues.UPDATE_OBJECTS, handleMessage, { noAck: false });

        async function handleMessage(message) {
          console.log(`update_geodata_object request`);
          const request = JSON.parse(message.content.toString());
          const result = await updateObjects(request.layerId, request.updated);
          console.log(result);

          const notification = JSON.stringify({
            id: request.layerId,
            action: updateActions.UPDATE_OBJECTS,
            data: result,
          });
          channel.assertExchange(exchanges.UPDATED_LAYER, 'fanout', { durable: false });
          channel.publish(exchanges.UPDATED_LAYER, '', Buffer.from(notification));

          channel.assertQueue(queues.TABLE_CHANGED_NOTIFICATION, { durable: false });
          result.forEach((updated) => {
            const tableCenter = getTableCenter(updated.data.geometry.coordinates[0]);
            console.log(`push table center at {${tableCenter[0]},${tableCenter[0]}}`);
            const tablesNotification = `t:${updated.id},a:update,x:${tableCenter[0]},y:${tableCenter[1]}`;
            channel.sendToQueue(queues.TABLE_CHANGED_NOTIFICATION, Buffer.from(tablesNotification));
          });

          channel.ack(message);
        }
      })
      .catch((error) => {
        throw error;
      });
  }
  function removeObjectsHandler(connection) {
    const { removeObjects } = app.get('controllers');
    return connection
      .createChannel()
      .then((channel) => {
        channel.assertQueue(queues.REMOVE_OBJECTS, { durable: false });
        channel.prefetch(1);
        return channel.consume(queues.REMOVE_OBJECTS, handleMessage, { noAck: false });

        async function handleMessage(message) {
          console.log(`remove_geodata_object request`);
          const request = JSON.parse(message.content.toString());
          const result = await removeObjects(request.layerId, request.removed);
          console.log(result);

          const notification = JSON.stringify({
            id: request.layerId,
            action: updateActions.REMOVE_OBJECTS,
            data: result,
          });
          channel.assertExchange(exchanges.UPDATED_LAYER, 'fanout', { durable: false });
          channel.publish(exchanges.UPDATED_LAYER, '', Buffer.from(notification));

          channel.assertQueue(queues.TABLE_CHANGED_NOTIFICATION, { durable: false });
          result.forEach((removed) => {
            const tablesNotification = `t:${removed.id},a:remove`;
            channel.sendToQueue(queues.TABLE_CHANGED_NOTIFICATION, Buffer.from(tablesNotification));
          });

          channel.ack(message);
        }
      })
      .catch((error) => {
        throw error;
      });
  }
};
