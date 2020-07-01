const amqp = require('amqplib');
const { check } = require('prettier');

module.exports = async function (app) {
  const {
    amqp: { connection: url },
  } = app.get('config');

  const exchanges = {
    UPDATED_LAYER: 'updated_geodata_layer',
  };

  const queues = {
    GET_LAYER: 'get_geodata_layer',
    GET_LAYERS: 'get_geodata_layers',
    CREATE_OBJECT: 'create_geodata_object',
    UPDATE_OBJECTS: 'update_geodata_objects',
    REMOVE_OBJECTS: 'remove_geodata_objects',
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
        channel.assertExchange(exchanges.UPDATED_LAYER, 'fanout', { durable: false });
        channel.assertQueue(queues.CREATE_OBJECT, { durable: false });
        channel.prefetch(1);

        return channel.consume(queues.CREATE_OBJECT, handleMessage, { noAck: false });

        async function handleMessage(message) {
          console.log(`create_geodata_object request`);
          const request = JSON.parse(message.content.toString());
          const result = await createObject(request.layerId, { data: request.created });
          console.log(result);
          channel.publish(
            exchanges.UPDATED_LAYER,
            '',
            Buffer.from(JSON.stringify({ id: request.layerId })),
          );
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
        channel.assertExchange(exchanges.UPDATED_LAYER, 'fanout', { durable: false });
        channel.assertQueue(queues.UPDATE_OBJECTS, { durable: false });
        channel.prefetch(1);

        return channel.consume(queues.UPDATE_OBJECTS, handleMessage, { noAck: false });

        async function handleMessage(message) {
          console.log(`update_geodata_object request`);
          const request = JSON.parse(message.content.toString());
          const result = await updateObjects(request.layerId, request.updated);
          console.log(result);
          channel.publish(
            exchanges.UPDATED_LAYER,
            '',
            Buffer.from(JSON.stringify({ id: request.layerId })),
          );
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
        channel.assertExchange(exchanges.UPDATED_LAYER, 'fanout', { durable: false });
        channel.assertQueue(queues.REMOVE_OBJECTS, { durable: false });
        channel.prefetch(1);

        return channel.consume(queues.REMOVE_OBJECTS, handleMessage, { noAck: false });

        async function handleMessage(message) {
          console.log(`remove_geodata_object request`);
          const request = JSON.parse(message.content.toString());
          const result = await removeObjects(request.layerId, request.removed);
          console.log(result);
          channel.publish(
            exchanges.UPDATED_LAYER,
            '',
            Buffer.from(JSON.stringify({ id: request.layerId })),
          );
          channel.ack(message);
        }
      })
      .catch((error) => {
        throw error;
      });
  }
};
