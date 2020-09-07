const amqp = require('amqplib');

function getTableDiagonal(coordinates) {
  const [lt, _, rb, __] = coordinates[0];

  return [lt, rb];
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
    TABLE_CHANGED_NOTIFICATION: 'table_changed_notification',
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

          // const notification = JSON.stringify({
          //   id: request.layerId,
          //   action: updateActions.CREATE_OBJECT,
          //   data: result,
          // });
          // channel.assertExchange(exchanges.UPDATED_LAYER, 'fanout', { durable: false });
          // channel.publish(exchanges.UPDATED_LAYER, '', Buffer.from(notification));

          const [lt, rb] = getTableDiagonal(result.data.geometry.coordinates);
          const tablesNotification = `t:${result.id},a:create,x11:${lt[0]},x22:${rb[0]},y11:${lt[1]},y22:${rb[1]}`;
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

          // const notification = JSON.stringify({
          //   id: request.layerId,
          //   action: updateActions.UPDATE_OBJECTS,
          //   data: result,
          // });
          // channel.assertExchange(exchanges.UPDATED_LAYER, 'fanout', { durable: false });
          // channel.publish(exchanges.UPDATED_LAYER, '', Buffer.from(notification));

          channel.assertQueue(queues.TABLE_CHANGED_NOTIFICATION, { durable: false });
          result.forEach((updated) => {
            const [lt, rb] = getTableDiagonal(updated.data.geometry.coordinates);
            const tablesNotification = `t:${updated.id},a:update,x11:${lt[0]},x22:${rb[0]},y11:${lt[1]},y22:${rb[1]}`;
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

          // const notification = JSON.stringify({
          //   id: request.layerId,
          //   action: updateActions.REMOVE_OBJECTS,
          //   data: result,
          // });
          // channel.assertExchange(exchanges.UPDATED_LAYER, 'fanout', { durable: false });
          // channel.publish(exchanges.UPDATED_LAYER, '', Buffer.from(notification));

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
