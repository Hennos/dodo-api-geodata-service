const { Model } = require('objection');

class Layer extends Model {
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
    const Object = require('./object')();
    return {
      objects: {
        relation: Model.HasManyRelation,
        modelClass: Object,
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
  if (!app) return Layer;

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
          .then(() =>
            db('layers').insert([
              {
                name: 'tables',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                name: 'robots',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ]),
          )
          .then(() => console.log('Prepare layers data')) // eslint-disable-line no-console
          .catch((e) => console.error('Error creating layers table', e)); // eslint-disable-line no-console
      }
    })
    .catch((e) => console.error('Error creating layers table', e)); // eslint-disable-line no-console

  return Layer;
};
