'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Fattening extends Model {
    static associate(models) {
      // Definisikan asosiasi di sini jika diperlukan
    }
  }
  
  Fattening.init({
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
    rentang_fattening: {
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
    interval_pakan: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Fattening', // Nama model yang benar
    tableName: 'd_fattening', // Nama tabel di database Anda
  });

//   Fattening.associate = function (models) {
//     Fattening.hasMany(models.BahanPakan, {
//         foreignKey: 'qr_id',
//         as: 'bahan_pakan'
//     });
//     Fattening.belongsTo(models.Peternakan, {
//         foreignKey: 'id_peternakan',
//         as: 'peternakan'
//     });
// };

  return Fattening;
};
