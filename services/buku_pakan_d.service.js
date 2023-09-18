// Helper databse yang dibuat
const joi = require('joi');
const { newError, errorHandler } = require('../utils/errorHandler');
const {Op} = require('sequelize');

class _buku_pakan_d {
    constructor(db) {
        this.db = db;
    }

    getTernakFattening = async (req) => {
        try {
            // Get ternak in waiting list perkawinan
            const ternakFattening = await this.db.Ternak.findAll({
                attributes: ['id_ternak','id_fp','qr_id'],
                include: [
                    {
                        model: this.db.Kandang,
                        as: 'kandang',
                        attributes: ['id_kandang','kode_kandang']
                    },

                ],
                where: {
                    id_fp: 13, // fattening
                }
            });

            // const fattening = await this.db.Fattening.findAll({
            //     attributes: ['target_berat'],
            // });

            if (ternakFattening.length <= 0) newError(404, 'Data Ternak Waiting List Perkawinan tidak ditemukan', 'getternakFattening Service');

            return {
                code: 200,
                data: {
                    total: ternakFattening.length,
                    list: ternakFattening,
                    // detail_fattening: fattening
                },
            }
        } catch (error) {
            return errorHandler(error);
        }
    }

    getTernakMainFattening = async (req) => {
        try {
            // Get ternak in waiting list perkawinan
            const ternakMainFattening = await this.db.Fattening.findAll({
                attributes: ['qr_id','id_fattening','id_ternak','id_kandang','target_berat','rentang_fattening','id_jenis_pakan','interval_pakan','createdAt','updatedAt'],
            });

            if (ternakMainFattening.length <= 0) newError(404, 'Data Ternak Main Fattening tidak ditemukan', 'getternakMainFattening Service');

            return {
                code: 200,
                data: {
                    total: ternakMainFattening.length,
                    list: ternakMainFattening,
                },

            }
        } catch (error) {
            return errorHandler(error);
        }
    }

    createFattening = async (req) => {
        try {
            // Ambil data yang dibutuhkan dari permintaan (request)
            const {
                qr_id,
                // Hapus id_ternak dari sini
                id_kandang,
                target_berat,
                rentang_fattening,
                id_jenis_pakan,
                interval_pakan,
                id_bahan_pakan,
            } = req.body;
    
            console.log(req.body);
    
            // Validasi data input menggunakan Joi atau sesuai kebutuhan Anda
            const schema = joi.object({
                qr_id: joi.string().required(),
                id_kandang: joi.number().required(),
                target_berat: joi.number().required(),
                rentang_fattening: joi.number().required(),
                id_jenis_pakan: joi.number().required(),
                interval_pakan: joi.number().required(),
                id_bahan_pakan: joi.number().required(),
            });
    
            const { error } = schema.validate(req.body);
    
            if (error) {
                return newError(400, 'Invalid input data', 'createFattening Service');
            }
    
            // Cari "id_ternak" berdasarkan "qr_id" dari tabel "s_ternak"
            const ternak = await this.db.Ternak.findOne({ where: { qr_id } });
    
            if (!ternak) {
                return newError(404, 'Ternak not found', 'createFattening Service');
            }
    
            // Buat data Fattening baru dengan "id_ternak" yang ditemukan
            const newFattening = await this.db.Fattening.create({
                id_ternak: ternak.id_ternak,
                id_kandang,
                target_berat,
                rentang_fattening,
                id_jenis_pakan,
                interval_pakan,
                id_bahan_pakan,
                qr_id,
            });
    
            if (!newFattening) {
                return newError(500, 'Failed to create Fattening data', 'createFattening Service');
            }
    
            return {
                code: 201,
                data: newFattening,
            };
        } catch (error) {
            console.log(error);
            return errorHandler(error);
        }
    }

    editFattening = async (req) => {
        try {
            // Ambil data yang dibutuhkan dari permintaan (request)
            const {
                qr_id,
                id_fattening,
                id_kandang,
                target_berat,
                rentang_fattening,
                id_jenis_pakan,
                interval_pakan,
                id_bahan_pakan,
                
            } = req.body;
    
            console.log(req.body);
    
            // Validasi data input menggunakan Joi atau sesuai kebutuhan Anda
            const schema = joi.object({
                qr_id: joi.string().required(),
                id_fattening: joi.number().required(),
                id_kandang: joi.number().required(),
                target_berat: joi.number().required(),
                rentang_fattening: joi.number().required(),
                id_jenis_pakan: joi.number().required(),
                interval_pakan: joi.number().required(),
                id_bahan_pakan: joi.number().required(),
            });
    
            const { error } = schema.validate(req.body);
    
            if (error) {
                return newError(400, 'Invalid input data', 'editFattening Service');
            }
    
            // Periksa apakah Fattening data dengan ID yang diberikan ada
            const existingFattening = await this.db.Fattening.findOne({ where: { id_fattening } });
    
            if (!existingFattening) {
                return newError(404, 'Fattening data not found', 'editFattening Service');
            }
    
            // Lakukan update data Fattening
            const updatedFattening = await existingFattening.update({
                qr_id,
                id_kandang,
                target_berat,
                rentang_fattening,
                id_jenis_pakan,
                interval_pakan,
                id_bahan_pakan,
            });
    
            return {
                code: 200,
                data: updatedFattening,
            };
        } catch (error) {
            console.log(error);
            return errorHandler(error);
        }
    }

    deleteFattening = async (req) => {
        try {
            // Ambil qr_id yang akan digunakan untuk mencari data Fattening dari body request
            const { qr_id } = req.body;
    
            // Periksa apakah Fattening data dengan qr_id yang diberikan ada
            const existingFattening = await this.db.Fattening.findOne({ where: { qr_id } });
    
            if (!existingFattening) {
                return newError(404, 'Fattening data not found', 'deleteFatteningByQRIDFromBody Service');
            }
    
            // Hapus Fattening data
            await existingFattening.destroy();
    
            return {
                code: 204, // 204 adalah status No Content yang digunakan untuk operasi penghapusan yang sukses
                message: 'Fattening data deleted successfully',
            };
        } catch (error) {
            console.log(error);
            return errorHandler(error);
        }
    }
    
    
    

}

module.exports = (db) => new _buku_pakan_d(db);