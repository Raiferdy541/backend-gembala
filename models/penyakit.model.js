module.exports = (Sequelize, DataTypes) => {
    const Penyakit = Sequelize.define("Penyakit", {
        id_penyakit:{
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        nama_penyakit:{
          type: DataTypes.STRING,
          allowNull: false
        },
        deskripsi:{
          type: DataTypes.STRING,
          allowNull: false
        },
        ciri:{
          type: DataTypes.STRING,
          allowNull: false
        },
        pengobatan:{
          type: DataTypes.STRING,
          allowNull: false
        },
        createdAt: {
          allowNull: false,
          type: DataTypes.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: DataTypes.DATE,
        }
    }, {
        tableName: "d_penyakit",
    });

    return Penyakit;
}