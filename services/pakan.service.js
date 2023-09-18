const DateExtension = require('@joi/date')
const Joi = require('joi');
const joi = Joi.extend(DateExtension);
const date = require('date-and-time');
const {newError, errorHandler} = require('../utils/errorHandler');

class _pakan{
    constructor(db){
        this.db = db;
    }

    //test --------
    // d_pakan
    getPakanTernak = async (req) => {
        try {
            // Get ternak in waiting list perkawinan
            const PakanTernak = await this.db.Pakan.findAll({
                // attributes: ['id_pakan'],
            });

            if (PakanTernak.length <= 0) newError(404, 'Data Pakan Ternak tidak ditemukan', 'getPakanTernak Service');

            return {
                code: 200,
                data: {
                    total: PakanTernak.length,
                    list: PakanTernak,
                },

            }
        } catch (error) {
            return errorHandler(error);
        }
    }

    // create d_bahan_pakan
    createBahanPakanTernak = async (req) => {
        try {
            // Ambil data yang dibutuhkan dari permintaan (request)
            const {
                id_peternakan, 
                id_jenis_bahan_pakan,
                tanggal, 
                jumlah,
                keterangan 
            } = req.body;
    
            // Validasi data input menggunakan Joi atau sesuai kebutuhan Anda
            const schema = joi.object({
                id_peternakan: joi.number().required(),
                id_jenis_bahan_pakan: joi.number().required(),
                tanggal: joi.date().required(),
                jumlah: joi.number().required(),
                keterangan: joi.string().required()
            });
    
            const { error } = schema.validate(req.body);
    
            if (error) {
                return newError(400, 'Invalid input data', 'createFattening Service');
            }
    
            // Selanjutnya, Anda dapat membuat entitas baru atau melakukan operasi lain sesuai kebutuhan Anda.
            const newBahanPakanTernak = await this.db.BahanPakan.create({
                id_peternakan,
                id_jenis_bahan_pakan,
                tanggal,
                jumlah,
                keterangan
            });
    
            if (!newBahanPakanTernak) {
                return newError(500, 'Failed to create Bahan Pakan Ternak data', 'createBahanPakanTernak Service');
            }
    
            return {
                code: 201,
                data: newBahanPakanTernak,
            };
        } catch (error) {
            console.log(error);
            return errorHandler(error);
        }
    }
    

    // d_bahan_pakan // main buku pakan
    getBahanPakanTernak = async (req) => {
        try {
            // Get ternak in waiting list perkawinan
            const PakanTernak = await this.db.BahanPakan.findAll({
                // attributes: ['id_pakan'],
                // include: [
                //     {
                //         model: this.db.JenisBahanPakan,
                //         as: 'jenis_bahan_pakan',
                //         // attributes: ['id_jenis_bahan','kode_kandang']
                //     },
                // ],
            });

            if (PakanTernak.length <= 0) newError(404, 'Data Pakan Ternak tidak ditemukan', 'getPakanTernak Service');

            return {
                code: 200,
                data: {
                    total: PakanTernak.length,
                    list: PakanTernak,
                },

            }
        } catch (error) {
            return errorHandler(error);
        }
    }

    // create d_jenis_bahan_pakan
    createJenisBahanPakanTernak = async (req) => {
        try {
            // Ambil data yang dibutuhkan dari permintaan (request)
            const {
                id_peternakan, // Mengganti id_jenis_pakan dengan id_peternakan
                jenis_bahan_pakan,
                satuan, // Mengganti id_bahan_pakan dengan satuan
                stok, // Menambahkan atribut stok yang baru
            } = req.body;
        
            console.log(req.body);
        
            // Validasi data input menggunakan Joi atau sesuai kebutuhan Anda
            const schema = joi.object({
                id_peternakan: joi.number().required(), // Mengganti id_jenis_pakan dengan id_peternakan
                jenis_bahan_pakan: joi.string().required(), // Mengganti id_bahan_pakan dengan satuan
                satuan: joi.string().required(), // Mengganti id_bahan_pakan dengan satuan
                stok: joi.number().required(), // Menambahkan atribut stok yang baru
            });
        
            const { error } = schema.validate(req.body);
        
            if (error) {
                return newError(400, 'Invalid input data', 'createFattening Service');
            }
        
            // Cari "id_ternak" berdasarkan "qr_id" dari tabel "s_ternak"
            // const ternak = await this.db.JenisBahanPakan.findOne({ where: { qr_id } });
        
            // if (!ternak) {
            //     return newError(404, 'Ternak not found', 'createFattening Service');
            // }
        
            // Buat data Fattening baru dengan "id_ternak" yang ditemukan
            const newJenisBahanPakan = await this.db.JenisBahanPakan.create({
                jenis_bahan_pakan,
                id_peternakan,
                satuan, 
                stok, 
            });
        
            if (!newJenisBahanPakan) {
                return newError(500, 'Failed to create Fattening data', 'createFattening Service');
            }
        
            return {
                code: 201,
                data: newJenisBahanPakan,
            };
        } catch (error) {
            console.log(error);
            return errorHandler(error);
        }
        
    }

    // d_jenis_bahan_pakan
    getJenisBahanPakanTernak = async (req) => {
        try {
            // Get ternak in waiting list perkawinan
            const PakanTernak = await this.db.JenisBahanPakan.findAll({
                // attributes: ['id_pakan'],
                include: [
                    {
                        model: this.db.BahanPakan,
                        as: 'bahan_pakan',
                        // attributes: ['id_jenis_bahan','kode_kandang']
                    },
                ]
            });

            if (PakanTernak.length <= 0) newError(404, 'Data Pakan Ternak tidak ditemukan', 'getPakanTernak Service');

            return {
                code: 200,
                data: {
                    total: PakanTernak.length,
                    list: PakanTernak,
                },

            }
        } catch (error) {
            return errorHandler(error);
        }
    }
    ///---------

    // get data pakan
    getJenisPakan = async (req) => {
        try{
            // Add id_peternakan to params
            req.query.id_peternakan = req.dataAuth.id_peternakan

            // get jenis pakan
            const list = await this.db.JenisPakan.findAll({
                where : req.query
            });
            if(list.length <= 0) newError(404, 'Jenis pakan tidak ditemukan', 'getJenisPakan Service');

            // Get data Pakan
            const data = await this.db.Pakan.findAll({
                where : {
                    id_peternakan : req.dataAuth.id_peternakan
                }
            });

            for(let i=0; i < list.length; i ++){
                list[i].dataValues.stok_siap = data.length > 0 ? data.filter((item) => item.dataValues.id_jenis_pakan == list[i].dataValues.id_jenis_pakan && item.dataValues.tanggal_pembuatan != null && item.dataValues.tanggal_konsumsi <= new Date()).length : 0;
                list[i].dataValues.stok_belum_siap = data.length > 0 ? data.filter((item) => item.dataValues.id_jenis_pakan == list[i].dataValues.id_jenis_pakan && item.dataValues.tanggal_pembuatan != null && item.dataValues.tanggal_konsumsi > new Date()).length : 0;
                list[i].dataValues.stok_belum_dibuat = data.length > 0 ? data.filter((item) => item.dataValues.id_jenis_pakan == list[i].dataValues.id_jenis_pakan && item.dataValues.tanggal_pembuatan == null).length : 0;
            }

            if(list.length <= 0) newError(404, 'Jenis pakan tidak ditemukan');
    
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
    createJenisPakan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                jenis_pakan: joi.string().required(),
                interval_pakan: joi.number().required(),
                satuan: joi.string().required(),
                komposisi: joi.string().allow(null),
                nutrien: joi.string().allow(null),
            }); 
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'createJenisPakan Service');

            // Create new jenis pakan
            const add = await this.db.JenisPakan.create({
                id_peternakan: req.dataAuth.id_peternakan,
                jenis_pakan: value.jenis_pakan,
                interval_pakan: value.interval_pakan,
                satuan: value.satuan,
                komposisi: value.komposisi,
                nutrien: value.nutrien,
            });
            if(!add) newError(500, 'Gagal menambah jenis pakan', 'createJenisPakan Service');

            return {
                code: 200,
                data: {
                    id_jenis_pakan: add.id_jenis_pakan,
                    jenis_pakan: add.jenis_pakan,
                    createdAt : add.createdAt,
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Update Jenis Pakan
    updateJenisPakan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_jenis_pakan: joi.number().required(),
                jenis_pakan: joi.string().required(),
                interval_pakan: joi.number().required(),
                satuan: joi.string().required(),
                komposisi: joi.string().allow(null),
                nutrien: joi.string().allow(null),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'updateJenisPakan Service');

            // Update jenis pakan
            const update = await this.db.JenisPakan.update({
                jenis_pakan: value.jenis_pakan,
                interval_pakan: value.interval_pakan,
                satuan: value.satuan,
                komposisi: value.komposisi,
                nutrien: value.nutrien,
            }, {
                where: {
                    id_jenis_pakan: value.id_jenis_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(update <= 0) newError(500, 'Gagal update jenis pakan', 'updateJenisPakan Service');

            return {
                code: 200,
                data: {
                    id_jenis_pakan: value.id_jenis_pakan,
                    jenis_pakan: value.jenis_pakan,
                    updatedAt : new Date(),
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Delete Jenis Pakan
    deleteJenisPakan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_jenis_pakan: joi.number().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'deleteJenisPakan Service');
            
            const del = await this.db.JenisPakan.destroy({
                where: {
                    id_jenis_pakan: value.id_jenis_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(del <= 0) newError(500, 'Gagal menghapus jenis pakan', 'deleteJenisPakan Service');

            return {
                code: 200,
                data: {
                    id_jenis_pakan: value.id_jenis_pakan,
                    deletedAt : new Date(),
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Get pakan
    getPakan = async (req) => {
        try{
            // Add id_peternakan to params
            req.query.id_peternakan = req.dataAuth.id_peternakan
            // Query data
            const list = await this.db.Pakan.findAll({
                attributes: ['id_pakan', 'id', 'tanggal_pembuatan', 'tanggal_konsumsi', 'createdAt', 'updatedAt'],
                include: [{
                    model: this.db.JenisPakan,
                    as: 'jenis_pakan',
                    attributes: ['id_jenis_pakan', 'jenis_pakan', 'interval_pakan', 'satuan', 'komposisi', 'nutrien', 'createdAt', 'updatedAt'],
                }],
                where: req.query,
            });
            if(list.length <= 0) newError(404, 'Pakan tidak ditemukan');

            for(let i = 0; i < list.length; i++){
                if(list[i].dataValues.tanggal_konsumsi != null){
                    list[i].dataValues.status = list[i].dataValues.tanggal_konsumsi < new Date() ? 'Siap' : 'Belum Siap';
                }else{
                    list[i].dataValues.status = 'Kosong';
                }
            }

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
    createPakan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_jenis_pakan: joi.number().required(),
                id: joi.number().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'createPakan Service');

            // check id jenis_pakan
            const jenis_pakan = await this.db.Pakan.findOne({
                where: {
                    id: value.id,
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_jenis_pakan: value.id_jenis_pakan,
                }
            });
            if(jenis_pakan) newError(400, 'ID jenis pakan sudah ada', 'createPakan Service');

            // add data pakan
            const add = await this.db.Pakan.create({
                id_peternakan: req.dataAuth.id_peternakan,
                id_jenis_pakan: value.id_jenis_pakan,
                id: value.id,
            });
            if(!add) newError(500, 'Gagal menambahkan pakan', 'createPakan Service');

            return {
                code: 200,
                data: {
                    id_pakan: add.id_pakan,
                    id_jenis_pakan: add.id_jenis_pakan,
                    id: add.id,
                    createdAt : add.createdAt
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Update Pakan
    updatePakan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_pakan: joi.number().required(),
                id_jenis_pakan: joi.number().required(),
                id: joi.number().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'updatePakan Service');

            // check id jenis_pakan
            const jenis_pakan = await this.db.Pakan.findOne({
                where: {
                    id: value.id,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(jenis_pakan) newError(400, 'ID jenis pakan sudah ada', 'updatePakan Service');

            // update data pakan
            const update = await this.db.Pakan.update({
                id_jenis_pakan: value.id_jenis_pakan,
                id: value.id,
            }, {
                where: {
                    id_pakan: value.id_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(update <= 0) newError(500, 'Gagal mengubah pakan', 'updatePakan Service');

            return {
                code: 200,
                data: {
                    id_pakan: value.id_pakan,
                    id_jenis_pakan: value.id_jenis_pakan,
                    id: value.id,
                    updatedAt : new Date(),
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Delete Pakan
    deletePakan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_pakan: joi.number().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'deletePakan Service');

            // Delete data pakan
            const del = await this.db.Pakan.destroy({
                where: {
                    id_pakan: value.id_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(del <= 0) newError(500, 'Gagal menghapus pakan', 'deletePakan Service');

            return {
                code: 200,
                data: {
                    id_pakan: value.id_pakan,
                    deletedAt : new Date(),
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Fill Pakan
    fillPakan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_pakan: joi.number().required(),
                tanggal_pembuatan: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
                tanggal_konsumsi: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'fillPakan Service');

            // Get data pakan
            const pakan = await this.db.Pakan.findOne({
                where: {
                    id_pakan: value.id_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(!pakan) newError(404, 'Pakan tidak ditemukan', 'fillPakan Service');

            // Get data jenis pakan
            const jenisPakan = await this.db.JenisPakan.findOne({
                where: {
                    id_jenis_pakan: pakan.id_jenis_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(!jenisPakan) newError(404, 'Jenis pakan tidak ditemukan', 'fillPakan Service');

            // Query data
            const update = await this.db.Pakan.update({
                tanggal_pembuatan: value.tanggal_pembuatan != null ? value.tanggal_pembuatan : new Date(),
                tanggal_konsumsi: value.tanggal_konsumsi != null ? value.tanggal_konsumsi : date.addDays(value.tanggal_pembuatan ? value.tanggal_pembuatan : new Date(), jenisPakan.interval_pakan),
            }, {
                where: {
                    id_pakan: value.id_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(update <= 0) newError(500, 'Gagal mengisi pakan', 'fillPakan Service');

            return {
                code: 200,
                data: {
                    id_pakan: update.id_pakan,
                    tanggal_pembuatan: value.tanggal_pembuatan ? value.tanggal_pembuatan : new Date(),
                    tanggal_konsumsi: value.tanggal_konsumsi ? value.tanggal_konsumsi : date.addDays(value.tanggal_pembuatan ? value.tanggal_pembuatan : new Date(), jenisPakan.interval_pakan),
                    updatedAt : new Date(),
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }
    
    // Update fill Pakan
    updateFillPakan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_pakan: joi.number().required(),
                tanggal_pembuatan: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
                tanggal_konsumsi: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'updateFillPakan Service');

            // Get data pakan
            const pakan = await this.db.Pakan.findOne({
                where: {
                    id_pakan: value.id_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(!pakan) newError(404, 'Pakan tidak ditemukan', 'updateFillPakan Service');

            // Get data jenis pakan
            const jenisPakan = await this.db.JenisPakan.findOne({
                where: {
                    id_jenis_pakan: pakan.dataValues.id_jenis_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(!jenisPakan) newError(404, 'Jenis pakan tidak ditemukan', 'updateFillPakan Service');

            // Query data
            const update = await this.db.Pakan.update({
                tanggal_pembuatan: value.tanggal_pembuatan ? value.tanggal_pembuatan : new Date(),
                tanggal_konsumsi: value.tanggal_konsumsi ? value.tanggal_konsumsi : date.addDays(value.tanggal_pembuatan ? value.tanggal_pembuatan : new Date(), jenisPakan.dataValues.interval_pakan),
            }, {
                where: {
                    id_pakan: value.id_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(update <= 0) newError(500, 'Gagal mengubah isi pakan', 'updateFillPakan Service');

            return {
                code: 200,
                data: {
                    id_pakan: value.id_pakan,
                    tanggal_pembuatan: value.tanggal_pembuatan ? value.tanggal_pembuatan : new Date(),
                    tanggal_konsumsi: value.tanggal_konsumsi ? value.tanggal_konsumsi : date.addDays(value.tanggal_pembuatan ? value.tanggal_pembuatan : new Date(), jenisPakan.dataValues.interval_pakan),
                    updatedAt : new Date(),
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Empty Pakan
    emptyPakan = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                id_pakan: joi.number().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'emptyPakan Service');

            // Update data
            const update = await this.db.Pakan.update({
                tanggal_pembuatan: null,
                tanggal_konsumsi: null,
            }, {
                where: {
                    id_pakan: value.id_pakan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(update <= 0) newError(500, 'Gagal mengosongkan pakan', 'emptyPakan Service');

            return {
                code: 200,
                data: {
                    id_pakan: value.id_pakan,
                    tanggal_pembuatan: null,
                    tanggal_konsumsi: null,
                    updatedAt : new Date(),
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }
}

module.exports = (db) => new _pakan(db);