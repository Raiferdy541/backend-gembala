// Helper databse yang dibuat
const DateExtension = require('@joi/date')
const Joi = require('joi');
const joi = Joi.extend(DateExtension);
const date = require('date-and-time');
const {newError, errorHandler} = require('../utils/errorHandler');

class _bahanPakan{
    constructor(db){
        this.db = db;
    }
    // get data pakan
    getJenisBahanPakan = async (req) => {
        try{
            // Add id_user to params
            req.query.id_peternakan = req.dataAuth.id_peternakan
            // Query data
            const list = await this.db.JenisBahanPakan.findAll({
                where : req.query
            });
            if(list.length <= 0) newError(404, 'Data Bahan Pakan tidak ditemukan', 'getJenisBahanPakan');
    
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

    // Create new Pakan
    createJenisBahanPakan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                jenis_bahan_pakan: joi.string().required(),
                satuan: joi.string().required(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'createJenisBahanPakan');

            const add = await this.db.JenisBahanPakan.create({
                id_peternakan: req.dataAuth.id_peternakan,
                jenis_bahan_pakan: value.jenis_bahan_pakan,
                satuan: value.satuan,
            });
            if(!add) newError(500, 'Gagal menambahkan jenis bahan pakan', 'createJenisBahanPakan');

            return {
                code: 200,
                data: {
                    id_jenis_bahan_pakan: add.id_jenis_bahan_pakan,
                    jenis_bahan_pakan: add.jenis_bahan_pakan,
                    createdAt : date.format(add.createdAt, 'YYYY-MM-DD HH:mm:ss')
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Update Jenis Bahan Pakan
    updateJenisBahanPakan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_jenis_bahan_pakan: joi.number().required(),
                jenis_bahan_pakan: joi.string().required(),
                satuan: joi.string().required(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'updateJenisBahanPakan');

            // Query data
            const update = await this.db.JenisBahanPakan.update({
                jenis_bahan_pakan: value.jenis_bahan_pakan,
                satuan: value.satuan,
            }, {
                where: {
                    id_jenis_bahan_pakan: value.id_jenis_bahan_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });

            if(update <= 0) newError(500, 'Gagal mengupdate jenis bahan pakan', 'updateJenisBahanPakan');

            return {
                code: 200,
                data: {
                    id_jenis_bahan_pakan: value.id_jenis_bahan_pakan,
                    jenis_bahan_pakan: value.jenis_bahan_pakan,
                    updatedAt: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Delete Jenis Bahan Pakan
    deleteJenisBahanPakan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_jenis_bahan_pakan: joi.number().required()
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'deleteJenisBahanPakan');

            // Query data
            const del = await this.db.JenisBahanPakan.destroy({
                where: {
                    id_jenis_bahan_pakan: value.id_jenis_bahan_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if (del <= 0) newError(500, 'Gagal menghapus jenis bahan pakan', 'deleteJenisBahanPakan');

            return {
                code: 200,
                data: {
                    id_jenis_bahan_pakan: value.id_jenis_bahan_pakan,
                    deletedAt: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Get data bahan pakan
    getBahanPakan = async (req) => {
        try{
            // Add id_user to params
            req.query.id_peternakan = req.dataAuth.id_peternakan
            // Query data
            const list = await this.db.BahanPakan.findAll({
                attributes : ['id_bahan_pakan', "tanggal", "jumlah", "keterangan", "createdAt", "updatedAt"],
                include: [
                    {
                        model: this.db.JenisBahanPakan,
                        as: 'jenis_bahan_pakan',
                        attributes: ['id_jenis_bahan_pakan', 'jenis_bahan_pakan', 'satuan']
                    }
                ],  
                where : req.query
            });
            if(list.length <= 0) newError(404, 'Data Bahan Pakan tidak ditemukan', 'getBahanPakan');
    
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

        // Get data bahan pakan //
        getAllBahanPakan = async (req) => {
            try{
                // Query data
                const list = await this.db.BahanPakan.findAll({
                    attributes : ['id_bahan_pakan', "tanggal", "jumlah", "keterangan", "createdAt", "updatedAt"],
                    include: [
                        {
                            model: this.db.JenisBahanPakan,
                            as: 'jenis_bahan_pakan',
                            attributes: ['id_jenis_bahan_pakan', 'jenis_bahan_pakan', 'satuan']
                        }
                    ],  
                });
                if(list.length <= 0) newError(404, 'Data Bahan Pakan tidak ditemukan', 'getBahanPakan');
        
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
        
    
    // Add new bahan pakan/ Mutasi bahan pakan
    createBahanPakan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_jenis_bahan_pakan: joi.number().required(),
                tanggal: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
                jumlah: joi.number().required(),
                keterangan: joi.string().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'createBahanPakan');

            // create mutasi bahan pakan
            const add = await this.db.BahanPakan.create({
                id_peternakan: req.dataAuth.id_peternakan,
                id_jenis_bahan_pakan: value.id_jenis_bahan_pakan,
                tanggal: value.tanggal == '' || value.tanggal == null ? new Date() : value.tanggal,
                jumlah: value.jumlah == '' || value.jumlah == null ? 0 : value.jumlah,
                keterangan: value.keterangan,
            });
            if(!add) newError(500, 'Gagal menambahkan bahan pakan', 'createBahanPakan');

            // update stok bahan pakan
            const update = await this.db.JenisBahanPakan.update({
                stok: value.keterangan.toLowerCase() == 'masuk' ? this.db.sequelize.literal(`stok + ${value.jumlah}`) : this.db.sequelize.literal(`stok - ${value.jumlah}`),
            }, {
                where: {
                    id_jenis_bahan_pakan: value.id_jenis_bahan_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(update <= 0) newError(500, 'Gagal mengupdate jenis bahan pakan', 'createBahanPakan');

            return {
                code: 200,
                data: {
                    id_bahan_pakan: add.id_bahan_pakan,
                    id_jenis_bahan_pakan: add.id_jenis_bahan_pakan,
                    createdAt : date.format(add.createdAt, 'YYYY-MM-DD HH:mm:ss')
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }
}

module.exports = (db) => new _bahanPakan(db);