const { Service } = require('feathers-objection');

exports.Layers = class Layers extends Service {
  constructor(options) {
    const { Model, ...otherOptions } = options;

    super({
      ...otherOptions,
      model: Model,
    });
  }

  async create(data, params) {
    return super.create(data, params);
  }
};
