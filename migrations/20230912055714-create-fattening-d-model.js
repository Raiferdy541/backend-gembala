'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('d_fattening', {
      id_fattening: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      qr_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 's_ternak',
          key: 'qr_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_ternak: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 's_ternak',
          key: 'id_ternak'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_kandang: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'd_kandang',
          key: 'id_kandang'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      target_berat: {
        type: Sequelize.INTEGER,
        allowNull: false,

      },
      rentang_fattening: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      id_jenis_pakan:{
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'd_jenis_pakan',
          key: 'id_jenis_pakan'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      id_bahan_pakan:{
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'd_bahan_pakan',
          key: 'id_bahan_pakan'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      id_bahan_pakan: {
        type: Sequelize.INTEGER,
        allowNull: true, 
        references: {
          model: 'd_bahan_pakan',
          key: 'id_bahan_pakan'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      interval_pakan: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('d_fattening');
  }
};