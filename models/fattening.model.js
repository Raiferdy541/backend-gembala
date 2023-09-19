'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Fattening_d extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Fattening_d.init({
    id_fattening: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    qr_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    id_ternak: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_kandang: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    target_berat: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_jenis_pakan: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_bahan_pakan: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    minggu_fattening: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status_fattening: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
  }, {
    sequelize,
    modelName: 'Fattening_d',
    tableName: 'd_fattenings'
  });
  return Fattening_d;
};