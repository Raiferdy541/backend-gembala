const joi = require('joi');
const {newError, errorHandler} = require('../utils/errorHandler');

class _timbangan{
    constructor(db){
        this.db = db;
    }
    // get Data Timbangan
    getDataTimbangan = async (req) => {
        try{
            // Query data
            const list = await this.db.Timbangan.findAll({
                attributes : ['id_timbangan', 'berat', 'suhu', 'tanggal_timbang', 'createdAt', 'updatedAt'],
                include: [
                    {
                        model: this.db.Ternak,
                        as: 'ternak',
                        attributes: ['id_ternak', 'qr_id']
                    }
                ],
                where : req.query
            });
            if(list.length <= 0) newError(404, 'Data Timbangan tidak ditemukan', 'getDataTimbangan Service');
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

    // Create new Data Timbangan
    createDataTimbangan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                qr_id: joi.string().required(),
                berat: joi.number().required(),
                suhu: joi.number().required()
            });

            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'createDataTimbangan Service');

            // Query data ternak
            const ternak = await this.db.Ternak.findOne({
                attributes: ['id_ternak', 'qr_id'],
                where: {
                    qr_id: value.qr_id
                }
            });
            if(!ternak) newError(404, 'Data Ternak tidak ditemukan', 'createDataTimbangan Service');

            // Query data
            const add = await this.db.Timbangan.create({
                id_ternak: ternak.id_ternak,
                qr_id : value.qr_id,
                berat: value.berat,
                suhu: value.suhu
            });
            if(!add) newError(500, 'Gagal menambahkan Data Timbangan', 'createDataTimbangan Service');

            return {
                code: 200,
                data: {
                    id_timbangan: add.id_timbangan,
                    id_ternak: add.id_ternak,
                    qr_id: add.qr_id,
                    createdAt: new Date()
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Update Data Timbangan
    updateDataTimbangan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_timbangan: joi.number().required(),
                berat: joi.number().required(),
                suhu: joi.number().required()
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'updateDataTimbangan Service');

            // Query data
            const update = await this.db.Timbangan.update({
                berat: value.berat,
                suhu: value.suhu,
            }, {
                where: {
                    id_timbangan: value.id_timbangan
                }
            });
            if(update <= 0) newError(500, 'Gagal mengubah Data Timbangan', 'updateDataTimbangan Service');

            return {
                code: 200,
                data: {
                    id_timbangan: value.id_timbangan,
                    updatedAt: new Date()
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Delete Data Timbangan
    deleteDataTimbangan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_timbangan: joi.number().required()
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'deleteDataTimbangan Service');

            // Query data
            const del = await this.db.Timbangan.destroy({
                where: {
                    id_timbangan: value.id_timbangan
                }
            });
            if(del <= 0) newError(500, 'Gagal menghapus Data Timbangan', 'deleteDataTimbangan Service');
            
            return {
                code: 200,
                data: {
                    id_timbangan: value.id_timbangan,
                    deletedAt: new Date()
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }
}

module.exports = (db) => new _timbangan(db);