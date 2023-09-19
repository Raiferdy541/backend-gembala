// Helper databse yang dibuat
const joi = require('joi');
const { newError, errorHandler } = require('../utils/errorHandler');
const {Op} = require('sequelize');

class _fattening_d {
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
                        model: this.db.Fase,
                        as: 'fase',
                        attributes: ['id_fp', 'fase']
                    },
                    {
                        model: this.db.Bangsa,
                        as: 'bangsa',
                        attributes: ['id_bangsa', 'bangsa']
                    },
                    {
                        model: this.db.Kandang,
                        as: 'kandang',
                        attributes: ['id_kandang', 'kode_kandang'],
                    },
                    {
                        model: this.db.Timbangan,
                        as: 'timbangan',
                        attributes: ['id_timbangan', 'berat', 'suhu'],
                    }
                ],
                
                where: {
                    id_fp: 13, // fattening
                }
            });

            // const fattening = await this.db.Fattening.findAll({
            //     attributes: ['target_berat'],
            // });

            if (ternakFattening.length <= 0) newError(404, 'Data Ternak Waiting List Perkawinan tidak ditemukan', 'getternakFattening Service');
            
            let totalByKandang = {}

            for(let i = 0; i < ternakFattening.length; i++){
                if(ternakFattening[i].dataValues.kandang.kode_kandang != null){

                    ternakFattening[i].dataValues.berat = ternakFattening[i].dataValues.timbangan.length > 0 ? ternakFattening[i].dataValues.timbangan[ternakFattening[i].dataValues.timbangan.length - 1].dataValues.berat : null;
                    ternakFattening[i].dataValues.suhu = ternakFattening[i].dataValues.timbangan.length > 0 ? ternakFattening[i].dataValues.timbangan[ternakFattening[i].dataValues.timbangan.length - 1].dataValues.suhu : null;
                    delete ternakFattening[i].dataValues.timbangan;
//
                    totalByKandang[ternakFattening[i].dataValues.kandang.kode_kandang] ? totalByKandang[ternakFattening[i].dataValues.kandang.kode_kandang]++ : totalByKandang[ternakFattening[i].dataValues.kandang.kode_kandang] = 1;
                }
            }

            const ternakBetina = ternakFattening.filter((item) => item.dataValues.jenis_kelamin != null && item.dataValues.jenis_kelamin.toLowerCase() == 'betina');
            const ternakJantan = ternakFattening.filter((item) => item.dataValues.jenis_kelamin != null && item.dataValues.jenis_kelamin.toLowerCase() == 'jantan');

            return {
                code: 200,
                data: {
                    total: ternakFattening.length,
                    ternak_betina: ternakBetina.length,
                    ternak_jantan: ternakJantan.length,
                    total_per_kandang: totalByKandang,
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
            const ternakMainFattening = await this.db.Fattening_d.findAll({
                // attributes: ['qr_id','id_fattening','id_ternak','id_kandang','target_berat','rentang_fattening','id_jenis_pakan','interval_pakan','createdAt','updatedAt'],
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
                minggu_fattening,
                status_fattening,
                id_jenis_pakan,
                id_bahan_pakan,
            } = req.body;
    
            console.log(req.body);
    
            // Validasi data input menggunakan Joi atau sesuai kebutuhan Anda
            const schema = joi.object({
                qr_id: joi.string().required(),
                id_kandang: joi.number().required(),
                target_berat: joi.number().required(),
                minggu_fattening: joi.number().required(),
                id_jenis_pakan: joi.number().required(),
                status_fattening: joi.string().required(),
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
            const newFattening = await this.db.Fattening_d.create({
                id_ternak: ternak.id_ternak,
                id_kandang,
                target_berat,
                minggu_fattening,
                id_jenis_pakan,
                status_fattening,
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
                id_fattening,
                qr_id,
                // Hapus id_ternak dari sini
                id_kandang,
                target_berat,
                minggu_fattening,
                status_fattening,
                id_jenis_pakan,
                id_bahan_pakan,
            } = req.body;
    
            console.log(req.body);
    
            // Validasi data input menggunakan Joi atau sesuai kebutuhan Anda
            const schema = joi.object({
                id_fattening: joi.number().required(),
                qr_id: joi.string().required(),
                id_kandang: joi.number().required(),
                target_berat: joi.number().required(),
                minggu_fattening: joi.number().required(),
                id_jenis_pakan: joi.number().required(),
                status_fattening: joi.string().required(),
                id_bahan_pakan: joi.number().required(),
            });
    
            // Cari "id_ternak" berdasarkan "qr_id" dari tabel "s_ternak"
            const ternak = await this.db.Ternak.findOne({ where: { qr_id } });

            const { error } = schema.validate(req.body);
    
            if (error) {
                return newError(400, 'Invalid input data', 'editFattening Service');
            }
    
            // Periksa apakah Fattening data dengan ID yang diberikan ada
            const existingFattening = await this.db.Fattening_d.findOne({ where: { id_fattening } });
    
            if (!existingFattening) {
                return newError(404, 'Fattening data not found', 'editFattening Service');
            }
    
            // Lakukan update data Fattening
            const updatedFattening = await existingFattening.update({
                id_fattening,
                id_ternak: ternak.id_ternak,
                id_kandang,
                target_berat,
                minggu_fattening,
                id_jenis_pakan,
                status_fattening,
                id_bahan_pakan,
                qr_id,
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
            const existingFattening = await this.db.Fattening_d.findOne({ where: { qr_id } });
    
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

module.exports = (db) => new _fattening_d(db);