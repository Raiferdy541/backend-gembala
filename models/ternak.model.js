module.exports = (Sequelize, DataTypes) => {
    const Ternak = Sequelize.define("Ternak", {
        id_ternak:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          qr_id:{
            type: DataTypes.STRING,
            allowNull: false
          },
          id_peternakan:{
            type: DataTypes.INTEGER,
            allowNull: false
          },
          image:{
            type: DataTypes.STRING,
            allowNull: true
          },
          jenis_kelamin:{
            type: DataTypes.STRING,
            allowNull: true
          },
          id_bangsa:{
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          id_kandang:{
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          id_status_ternak:{
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          id_fp:{
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          id_dam:{
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          id_sire:{
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          tanggal_lahir:{
            type: DataTypes.DATE,
            allowNull: true
          },
          tanggal_masuk:{
            type: DataTypes.DATE,
            allowNull: true
          },
          tanggal_keluar:{
            type: DataTypes.DATE,
            allowNull: true
          },
          status_keluar:{
            type: DataTypes.STRING,
            allowNull: true
          },
          createdAt:{
            type: DataTypes.DATE,
            allowNull: false
          },
          updatedAt:{
            type: DataTypes.DATE,
            allowNull: false
          }
    }, {
        tableName: "s_ternak",
    });
    
    Ternak.associate = function (models) {
      Ternak.belongsTo(models.Bangsa, {
          foreignKey: 'id_bangsa',
          as: 'bangsa'
      });
      Ternak.belongsTo(models.Kandang, {
          foreignKey: 'id_kandang',
          as: 'kandang'
      });
      Ternak.belongsTo(models.Fase, {
          foreignKey: 'id_fp',
          as: 'fase'
      });
      Ternak.belongsTo(models.StatusTernak, {
          foreignKey: 'id_status_ternak',
          as: 'status_ternak'
      });
      Ternak.belongsTo(models.Ternak, {
          foreignKey: 'id_dam',
          as: 'dam'
      });
      Ternak.belongsTo(models.Ternak, {
          foreignKey: 'id_sire',
          as: 'sire'
      });
      Ternak.hasMany(models.Timbangan, {
          foreignKey: 'id_ternak',
          as: 'timbangan'
      });
      Ternak.hasMany(models.RiwayatKesehatan, {
          foreignKey: 'id_ternak',
          as: 'riwayat_kesehatan'
      });
      Ternak.hasMany(models.Kesehatan, {
          foreignKey: 'id_ternak',
          as: 'kesehatan'
      });
      Ternak.belongsTo(models.Peternakan, {
          foreignKey: 'id_peternakan',
          as: 'peternakan'
      });
      Ternak.hasMany(models.RiwayatFase, {
          foreignKey: 'id_ternak',
          as: 'riwayat_fase'
      });
      Ternak.hasMany(models.Adaptasi, {
          foreignKey: 'id_ternak',
          as: 'adaptasi'
      });
      Ternak.hasMany(models.RiwayatKebuntingan, {
          foreignKey: 'id_indukan',
          as: 'riwayat_kebuntingan'
      });
    };
    return Ternak;
}