
const os     = require('os');
const path   = require('path');
const config = require('../config.json');

const { Sequelize, DataTypes } = require('sequelize');

const dbfile  = config.db;
const dbpath  = path.join(os.homedir(), ...dbfile.split('/'));
const dbconf  = config.sequelize;

const sequelize = new Sequelize('sqlite:' + dbpath, dbconf);


const Tax = sequelize.define('Tax', {
  code:     { type: DataTypes.STRING, primaryKey: true },
  province: { type: DataTypes.STRING, allowNull: false },
  type:     { type: DataTypes.STRING, allowNull: false },
  PST:      { type: DataTypes.DOUBLE, allowNull: false },
  GST:      { type: DataTypes.DOUBLE, allowNull: false }
});

module.exports = {
  Tax
};
