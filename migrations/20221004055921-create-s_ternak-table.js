'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('s_ternak', { 
      id_ternak:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      rf_id:{
        type: Sequelize.STRING,
        allowNull: false
      },
      id_user:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'auth_users',
          key: 'id_user'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      image:{
        type: Sequelize.STRING,
        allowNull: true
      },
      jenis_kelamin:{
        type: Sequelize.ENUM,
        values: [
          'Jantan',
          'Betina'
        ],
        defaultValue: 'Betina',
        allowNull: false
      },
      id_bangsa:{
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'd_bangsa',
          key: 'id_bangsa'
        }
      },
      id_kandang:{
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'd_kandang',
          key: 'id_kandang'
        }
      },
      id_fp:{
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'd_fase_pemeliharaan',
          key: 'id_fp'
        }
      },
      id_dam:{
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      id_sire:{
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      berat: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      suhu: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      tanggal_lahir:{
        type: Sequelize.DATE,
        allowNull: true
      },
      tanggal_masuk:{
        type: Sequelize.DATE,
        allowNull: true
      },
      tanggal_keluar:{
        type: Sequelize.DATE,
        allowNull: true
      },
      status_keluar:{
        type: Sequelize.ENUM,
        values: [
          'Dijual',
          'Dipotong',
          'Dikembalikan',
          'Mati',
          'Lainnya'
        ],
        allowNull: true
      },
      createdAt:{
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt:{
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      }
    }).then(() => {
      queryInterface.addConstraint('s_ternak', {
        fields: ['id_dam'],
        type: 'foreign key',
        name: 'fk_s_ternak_id_induk',
        references: {
          table: 's_ternak',
          field: 'id_ternak'
        },
        onDelete: 'set null',
        onUpdate: 'cascade'
      }).then(() => {
        queryInterface.addConstraint('s_ternak', {
          fields: ['id_sire'],
          type: 'foreign key',
          name: 'fk_s_ternak_id_pejantan',
          references: {
            table: 's_ternak',
            field: 'id_ternak'
          },
          onDelete: 'set null',
          onUpdate: 'cascade'
        })
      }
    );
  },
  )},
  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('s_ternak');
  }
};
