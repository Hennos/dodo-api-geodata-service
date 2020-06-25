const assert = require('assert');
const app = require('../../src/app');

describe('\'layers\' service', () => {
  it('registered the service', () => {
    const service = app.service('layers');

    assert.ok(service, 'Registered the service');
  });
});
