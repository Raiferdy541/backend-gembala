// Helper databse yang dibuat
const joi = require('joi');
const {newError, errorHandler} = require('../utils/errorHandler');
const {Op} = require('sequelize');

class _riwayatKesehatan{
    constructor(db){
        this.db = db;
    }
    // Get data RiwayatKesehatan
    getRiwayatKesehatan = async (req) => {
        try{
            // Add params
            req.query.id_peternakan = req.dataAuth.id_peternakan
            // Query data
            const list = await this.db.RiwayatKesehatan.findAll({ 
                attributes : ['id_riwayat_kesehatan', 'penyakit', 'tanggal_sakit', 'tanggal_sembuh', 'gejala', 'penanganan'],
                include: [
                    {
                        model: this.db.Ternak,
                        as: 'ternak',
                        attributes: ['id_ternak', 'qr_id'],
                        include: [
                            {
                                model: this.db.Kandang,
                                as: 'kandang',
                                attributes: ['id_kandang', 'kode_kandang']
                            }
                        ]
                    },
                ],
                where : req.query
            });
            if(list.length <= 0) newError(404, 'Data riwayat kesehatan tidak ditemukan', 'getRiwayatKesehatan Service');

            for(let i = 0; i < list.length; i++){
                list[i].dataValues.kandang = list[i].dataValues.ternak.kandang;
                delete list[i].dataValues.ternak.dataValues.kandang
            }

            return {
                code: 200,
                data: {
                    total: list.length,
                    list
                }
            };
        }catch (error){
            return errorHandler(error);
        }
    }

    // Delete RiwayatKesehatan
    deleteRiwayatKesehatan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_riwayat_kesehatan: joi.number().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'deleteRiwayatKesehatan Service');

            // Query data
            const del = await this.db.RiwayatKesehatan.destroy({
                where: {
                    id_riwayat_kesehatan: value.id_riwayat_kesehatan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(del <= 0) newError(500, 'Gagal menghapus data riwayat kesehatan', 'deleteRiwayatKesehatan Service');
            return {
                code: 200,
                data: {
                    id_riwayat_kesehatan: value.id_riwayat_kesehatan,
                    deletedAt: new Date()
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }
}

module.exports = (db) => new _riwayatKesehatan(db);