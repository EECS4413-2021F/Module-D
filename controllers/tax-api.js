/** @typedef {import('express').RequestHandler} RequestHandler */

const { Tax } = require('../models/orm-model.js');

module.exports = {

  /**
   * Retrieve all of the Tax entries within the database.
   * Responses with a JSON array of the Tax objects.
   * 
   * @type {RequestHandler}
   */
  getTaxes(req, res) {
    Tax.findAll().then((taxes) => {
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(taxes));
      res.end();
    }, console.log);
  },

  /**
   * Retrieve the Tax entry from the database
   * that matches the specified province code. Responses
   * with a JSON object of the matched Tax entry or an
   * error object if not found.
   *
   * @type {RequestHandler}
   */
  getTaxByCode(req, res) {
    const where = { code: req.params.code };
    Tax.findOne({ where }).then((tax) => {
      let response = tax || new Error('Tax code not found');
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(response));
      res.end();
    }, console.log);
  }
};
