const { Model } = require('objection');

module.exports = function (app) {
  const {
    db: { client, connection },
  } = app.get('config');

  const knex = require('knex')({ client, connection, useNullAsDefault: false });

  Model.knex(knex);

  app.set('knex', knex);
};
