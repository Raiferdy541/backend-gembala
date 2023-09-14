// Helper databse yang dibuat
const joi = require('joi');
const date = require('date-and-time');
const {newError, errorHandler} = require('../utils/errorHandler');
class _fase{
    constructor(db){
        this.db = db;
    }
    // Get Fase
    getFase = async (req) => {
        try{            
            // get all data fase
            const list = await this.db.Fase.findAll({
                include: [
                    {
                        model: this.db.Ternak,
                        as: 'ternak',
                        attributes: ['id_ternak', 'qr_id'],
                        include: [
                            {
                                model: this.db.Timbangan,
                                as: 'timbangan',
                                attributes: ['id_timbangan', 'berat', 'suhu'],
                            }
                        ]
                    }
                ],
                where: req.query
            });

            for(let i=0; i<list.length; i++){
                list[i].dataValues.populasi = list[i].dataValues.ternak.length;
                // const berat_total = list[i].dataValues.ternak.reduce((a, b) => a + b.dataValues.timbangan[b.dataValues.timbangan.length - 1].berat, 0);
                const berat_total = list[i].dataValues.ternak.reduce((a, b) => a + (b.dataValues.timbangan.length > 0 ? b.dataValues.timbangan[b.dataValues.timbangan.length - 1].berat : 0), 0);
                const berat_rata = berat_total / list[i].dataValues.ternak.length;
                list[i].dataValues.berat_rata = (!berat_rata) ? 0 : berat_rata;
                list[i].dataValues.berat_total = berat_total;
                for(let j=0; j<list[i].dataValues.ternak.length; j++){
                    delete list[i].dataValues.ternak[j].dataValues.timbangan;
                }
            }

            if(list.length <= 0) newError(404, 'Data Fase tidak ditemukan', 'getFase Service');
            
            return {
                code : 200,
                data: {
                    total: list.length,
                    list
                },
            };
        }catch (error){
            return errorHandler(error);
        }
    }

    // Create new fase
    createFase = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                fase: joi.string().required()
            });
            const {error, value} = schema.validate(req.body);
            if(error) newError(400, error.details[0].message, 'createFase Service');

            // Create new fase
            const add = await this.db.Fase.create({
                fase: value.fase
            });
            if(!add) newError(500, 'Gagal menambahkan data fase', 'createFase Service');

            return {
                code : 200,
                data: {
                    id_fase_pemeliharaan: add.id_fp,
                    createdAt: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
                },
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Update fase
    updateFase = async (req) => {
        try {
            // Validate Data
            const schema = joi.object({
                id_fp: joi.number().required(),
                fase: joi.string().required(),
            });
            const {error, value} = schema.validate(req.body);
            if(error) newError(400, error.details[0].message, 'updateFase Service');

            // Update data fase
            const update = await this.db.Fase.update({
                fase: value.fase
            }, {
                where: {
                    id_fp: value.id_fp
                }
            });
            if(update <= 0) newError(500, 'Gagal mengubah data fase', 'updateFase Service');

            return {
                code: 200,
                data: {
                    id_fp: value.id_fp,
                    updatedAt: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
                },
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Delete fase
    deleteFase = async (req) => {
        try {
            // Validate Data
            const schema = joi.object({
                id_fp: joi.number().required(),
            });
            const {error, value} = schema.validate(req.body);
            if(error) newError(400, error.details[0].message, 'deleteFase Service');

            // Delete data fase
            const del = await this.db.Fase.destroy({
                where: {
                    id_fp: value.id_fp
                }
            });
            if(del <= 0) newError(500, 'Gagal menghapus data fase', 'deleteFase Service');

            return {
                code: 200,
                data: {
                    id_fp: value.id_fp,
                    deletedAt: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
                },
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }
}

module.exports = (db) => new _fase(db);