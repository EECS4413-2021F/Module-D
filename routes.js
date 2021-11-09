/** @typedef {import('express').Application} Application */

const taxApi = require('./controllers/tax-api');


module.exports = {

  /**
   * Defines and binds each URI endpoint and HTTP method
   * to specific RequestHandler functions.
   *
   * @param {Application} app
   */
  configureRoutes(app) {
    app.get('/api/taxes',       taxApi.getTaxes);
    app.get('/api/taxes/:code', taxApi.getTaxByCode);
  }
};
