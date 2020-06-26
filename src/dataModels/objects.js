const { Model } = require('objection');

class Objects extends Model {
  static get tableName() {
    return 'objects';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['data', 'layerId'],

      properties: {
        data: { type: 'object' },
        layerId: { type: 'string' },
      },
    };
  }

  $beforeInsert() {
    this.createdAt = this.updatedAt = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = function (app) {
  if (!app) return Objects;

  const db = app.get('knex');

  db.schema
    .hasTable('objects')
    .then((exists) => {
      if (!exists) {
        db.schema
          .createTable('objects', (table) => {
            table.increments('id');
            table.json('data');
            table.string('layerId');
            table.timestamp('createdAt');
            table.timestamp('updatedAt');
          })
          .then(() => console.log('Created objects table')) // eslint-disable-line no-console
          .catch((e) => console.error('Error creating objects table', e)); // eslint-disable-line no-console
      }
    })
    .catch((e) => console.error('Error creating objects table', e)); // eslint-disable-line no-console

  return Objects;
};
