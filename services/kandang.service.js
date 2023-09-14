// Helper databse yang dibuat
const joi = require('joi');
const date = require('date-and-time');
const {newError, errorHandler} = require('../utils/errorHandler');
const {Op} = require('sequelize');
class _kandang{
    constructor(db){
        this.db = db;
    }
    // Get Kandang
    getKandang = async (req) => {
        try{
            // Add id_peternakan to params
            req.query.id_peternakan = req.dataAuth.id_peternakan
            // Query data
            const list = await this.db.Kandang.findAll({
                attributes : ['id_kandang', 'kode_kandang', 'persentase_kebutuhan_pakan', 'createdAt', 'updatedAt'],
                include: [
                    {
                        model: this.db.Ternak,
                        as: 'ternak',
                        attributes: [
                            'id_ternak',
                            'qr_id',
                            'status_keluar',
                            'tanggal_keluar',
                        ],
                        include: [
                            {
                                model: this.db.Timbangan,
                                as: 'timbangan',
                                attributes: [
                                    'id_timbangan',
                                    'berat',
                                ],
                            }
                        ]
                    },
                    {
                        model: this.db.JenisPakan,
                        as: 'jenis_pakan',
                        attributes: [
                            'id_jenis_pakan',
                            'jenis_pakan'
                        ]
                    },
                    {
                        model: this.db.JenisKandang,
                        as: 'jenis_kandang',
                        attributes: [
                            'id_jenis_kandang',
                            'jenis_kandang'
                        ]
                    }
                ],
                where : req.query
            });
            for (let i = 0; i < list.length; i++) {
                const populasi = list[i].dataValues.ternak.filter((item) => {
                    return item.dataValues.status_keluar == null && item.dataValues.tanggal_keluar == null
                });
                list[i].dataValues.populasi = populasi.length;
                const berat_total = list[i].dataValues.ternak.reduce((a, b) => a + ((b.dataValues.timbangan.length > 0 && b.dataValues.status_keluar == null && b.dataValues.tanggal_keluar == null)
                    ? b.dataValues.timbangan[b.dataValues.timbangan.length - 1].berat 
                    : 0), 0);
                list[i].dataValues.berat_total = berat_total;
                list[i].dataValues.berat_rata = berat_total / populasi.length;
                list[i].dataValues.kebutuhan_pakan = berat_total * (list[i].dataValues.persentase_kebutuhan_pakan/100);
                delete list[i].dataValues.ternak;
            }
            if(list.length <= 0) newError(404, 'Data Kandang tidak ditemukan', 'getKandang Service');

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

    // Create new kandang
    createKandang = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                kode_kandang: joi.string().required(),
                id_jenis_kandang: joi.number().required(),
                id_jenis_pakan: joi.number().required(),
                persentase_kebutuhan_pakan: joi.number().required()
            });

            const {error, value} = schema.validate(req.body);
            if(error) newError(400, error.message, 'createKandang Service');

            const add = await this.db.Kandang.create({
                id_peternakan: req.dataAuth.id_peternakan,
                kode_kandang: value.kode_kandang,
                id_jenis_kandang: value.id_jenis_kandang,
                id_jenis_pakan: value.id_jenis_pakan,
                persentase_kebutuhan_pakan: value.persentase_kebutuhan_pakan
            });
            if(!add) newError(500, 'Gagal menambahkan data kandang', 'createKandang Service');

            return {
                code : 200,
                data: {
                    id_kandang: add.id_kandang,
                    kode_kandang: add.kode_kandang,
                    id_jenis_kandang: add.id_jenis_kandang,
                    createdAt: date.format(add.createdAt, 'YYYY-MM-DD HH:mm:ss')
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Update kandang
    updateKandang = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_kandang: joi.number().required(),
                kode_kandang: joi.string().required(),
                id_jenis_kandang: joi.number().required(),
                id_jenis_pakan: joi.number().required(),
                persentase_kebutuhan_pakan: joi.number().required()
            });
            const {error, value} = schema.validate(req.body);
            if(error) newError(400, error.message, 'updateKandang Service');

            // Query data
            const update = await this.db.Kandang.update({
                kode_kandang: value.kode_kandang,
                id_jenis_kandang: value.id_jenis_kandang,
                id_jenis_pakan: value.id_jenis_pakan,
                persentase_kebutuhan_pakan: value.persentase_kebutuhan_pakan
            }, {
                where: {
                    id_kandang: value.id_kandang,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(update <= 0) newError(404, 'Data Kandang tidak ditemukan', 'updateKandang Service');

            return {
                code : 200,
                data: {
                    id_kandang: value.id_kandang,
                    updatedAt: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Delete kandang
    deleteKandang = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_kandang: joi.number().required(),
            });
            const {error, value} = schema.validate(req.body);
            if(error) newError(400, error.message, 'deleteKandang Service');

            // Delete data kandang
            const del = await this.db.Kandang.destroy({
                where: {
                    id_kandang: value.id_kandang,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(del <= 0) newError(404, 'Data Kandang tidak ditemukan', 'deleteKandang Service');
            
            return {
                code : 200,
                data: {
                    id_kandang: value.id_kandang,
                    deletedAt: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Get kode kandang
    getKodeKandang = async (req) => {
        try {
            const list = await this.db.Kandang.findAll({
                where: {
                    id_peternakan: req.dataAuth.id_peternakan
                },
                attributes: ['id_kandang', 'kode_kandang'],
                include: [
                    {
                        model: this.db.JenisKandang,
                        as: 'jenis_kandang',
                        attributes: ['jenis_kandang']
                    }
                ]
            });

            for(let i = 0; i < list.length; i++){
                list[i].dataValues.kode_kandang = list[i].dataValues.jenis_kandang ? `${list[i].dataValues.kode_kandang} - ${list[i].dataValues.jenis_kandang.jenis_kandang}` : `${list[i].dataValues.kode_kandang} - null`  
                delete list[i].dataValues.jenis_kandang
            }

            if(list.length <= 0) newError(404, 'Data Kandang tidak ditemukan', 'getKodeKandang Service');

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
}

module.exports = (db) => new _kandang(db);