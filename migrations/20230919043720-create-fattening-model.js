'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('d_fattenings', {
      id_fattening: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      qr_id: {
        type: Sequelize.STRING,
        allowNull: true,
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
        allowNull: false,
        references: {
          model: 'd_kandang',
          key: 'id_kandang'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      target_berat: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      minggu_fattening: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status_fattening: {
        type: Sequelize.STRING,
        allowNull: false
      },
      id_jenis_pakan: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'd_jenis_pakan',
          key: 'id_jenis_pakan'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      id_bahan_pakan: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'd_bahan_pakan',
          key: 'id_bahan_pakan'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('d_fattenings');
  }
};