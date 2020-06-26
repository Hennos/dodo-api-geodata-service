const { Model } = require('objection');

class Layers extends Model {
  static get tableName() {
    return 'layers';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],

      properties: {
        name: { type: 'string' },
      },
    };
  }

  static get relationMappings() {
    const Objects = require('./objects.model')();

    return {
      objects: {
        relation: Model.HasManyRelation,
        modelClass: Objects,
        join: {
          from: 'layers.id',
          to: 'objects.layerId',
        },
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
  if (!app) return Layers;

  const db = app.get('knex');

  db.schema
    .hasTable('layers')
    .then((exists) => {
      if (!exists) {
        db.schema
          .createTable('layers', (table) => {
            table.increments('id');
            table.string('name');
            table.timestamp('createdAt');
            table.timestamp('updatedAt');
          })
          .then(() => console.log('Created layers table')) // eslint-disable-line no-console
          .catch((e) => console.error('Error creating layers table', e)); // eslint-disable-line no-console
      }
    })
    .catch((e) => console.error('Error creating layers table', e)); // eslint-disable-line no-console

  return Layers;
};
