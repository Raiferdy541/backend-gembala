module.exports = (Sequelize, DataTypes) => {
    const LKPemasukan = Sequelize.define("LKPemasukan", {
          id_lk_pemasukan:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          id_peternakan:{
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          id_ternak:{
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          qr_id:{
            type: DataTypes.STRING,
            allowNull: false
          },
          id_bangsa:{
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          jenis_kelamin:{
            type: DataTypes.STRING,
            allowNull: false
          },
          cek_poel:{
            type: DataTypes.INTEGER,
            allowNull: false
          },
          cek_mulut:{
            type: DataTypes.STRING,
            allowNull: false
          },
          cek_telinga:{
            type: DataTypes.STRING,
            allowNull: false
          },
          cek_kuku_kaki:{
            type: DataTypes.STRING,
            allowNull: false
          },
          cek_kondisi_fisik_lain:{
            type: DataTypes.STRING,
            allowNull: true
          },
          cek_bcs:{
            type: DataTypes.INTEGER,
            allowNull: false
          },
          id_status_ternak:{
            type: DataTypes.INTEGER,
            allowNull: false
          },
          status_kesehatan:{
            type: DataTypes.STRING,
            allowNull: false
          },
          id_kandang:{
            type: DataTypes.INTEGER,
            allowNull: false,
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
        tableName: "d_lk_pemasukan",
    });

    LKPemasukan.associate = function (models) {
      LKPemasukan.belongsTo(models.Peternakan, {
        foreignKey: 'id_peternakan',
        as: 'peternakan'
      });
      LKPemasukan.belongsTo(models.Ternak, {
        foreignKey: 'id_ternak',
        as: 'ternak'
      });
      LKPemasukan.belongsTo(models.Bangsa, {
        foreignKey: 'id_bangsa',
        as: 'bangsa'
      });
      LKPemasukan.belongsTo(models.Kandang, {
        foreignKey: 'id_kandang',
        as: 'kandang'
      });
      LKPemasukan.belongsTo(models.StatusTernak, {
        foreignKey: 'id_status_ternak',
        as: 'status_ternak'
      });
    };

    return LKPemasukan;
}