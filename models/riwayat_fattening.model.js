module.exports = (Sequelize, DataTypes) => {
    const Fattening = Sequelize.define("Fattening", {
        id_fattening:{
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        qr_id:{
            type: DataTypes.STRING,
            allowNull: false
          },
        id_ternak:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_kandang:{
          type: DataTypes.INTEGER,
          allowNull: false
        },
        target_berat:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        rentang_fattening:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_jenis_pakan:{
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
        createdAt:{
          type: DataTypes.DATE,
          allowNull: false
        },
        updatedAt:{
          type: DataTypes.DATE,
          allowNull: false
        }
    }, {
        tableName: "d_fattening",
    });

    // Fattening.associate = function (models) {
    //     Fattening.belongsTo(models.Ternak, {
    //         foreignKey: 'id_ternak',
    //         as: 'ternak'
    //     });
    //     Fattening.belongsTo(models.Kandang, {
    //         foreignKey: 'id_kandang',
    //         as: 'kandang'
    //     });
    //     Fattening.belongsTo(models.JenisPakan, {
    //         foreignKey: 'id_jenis_pakan',
    //         as: 'jenis_pakan'
    //     });
    // };
    

    return Fattening;
}