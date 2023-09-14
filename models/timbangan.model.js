module.exports = (Sequelize, DataTypes) => {
    const Ternak = require('./ternak.model')(Sequelize, DataTypes);

    const Timbangan = Sequelize.define("Timbangan", {
          id_timbangan:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          id_ternak:{
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          qr_id:{
            type: DataTypes.STRING,
            allowNull: false
          },
          berat:{
            type: DataTypes.INTEGER,
            allowNull: false
          },
          suhu:{
            type: DataTypes.INTEGER,
            allowNull: false
          },
          tanggal_timbang:{
            type: DataTypes.DATE,
            allowNull: true
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
        tableName: "d_timbangan",
    });

    Timbangan.associate = function (models) {
      Timbangan.belongsTo(models.Ternak, {
        foreignKey: 'id_ternak',
        as: 'ternak'
      });
    };

    return Timbangan;
}