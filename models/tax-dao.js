
const os      = require('os');
const path    = require('path');
const sqlite3 = require('sqlite3');
const config  = require('../config.json');

const dbfile  = config.db;
const dbpath  = path.join(os.homedir(), ...dbfile.split('/'));
const db      = new (sqlite3.verbose()).Database(dbpath);

module.exports = {
  getTaxes(success, failure) { 
    db.all('SELECT * FROM Tax', (err, rows) => {
      if (err == null) {
        success(rows);
      } else {
        failure(err);
      }
    });
  },
  getTaxByCode(code, success, failure) { 
    db.all('SELECT * FROM Tax WHERE code = ?', [code], (err, rows) => {
      if (err == null) {
        success(rows[0]);
      } else {
        failure(err);
      }
    });
  }
};
