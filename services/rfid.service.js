const joi = require('joi');
const {newError, errorHandler} = require('../utils/errorHandler');
const premiumFarmChecker = require('../utils/premium_farm_checker');
const { Op } = require("sequelize");
const config = require('../config/app.config');

class _rfid{
    constructor(db){
        this.db = db;
    }
    // Get data rfid
    rfid = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                token: joi.string().required(),
                qr_id: joi.string().required(),
                jenis_ternak_baru: joi.string().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'rfid Service');

            // Check auth rfid
            if(!req.dataAuth) newError(401, 'Not authorized, no token', 'rfid Service');

            // Check jenis ternak baru
            if (value.jenis_ternak_baru.toLowerCase() !== "ternak baru" && value.jenis_ternak_baru.toLowerCase() !== "kelahiran") newError(400, "Jenis Ternak Baru harus 'Ternak Baru' atau 'Kelahiran'", 'rfid Service');

            // Get data status ternak cempe
            const statusTernakCempe = await this.db.StatusTernak.findOne({where: {status_ternak: "Cempe"}});
            if(!statusTernakCempe) newError(404, 'Data Status Ternak Cempe tidak ditemukan', 'rfid Service');

            // Check Ternak
            const checkTernak = await this.db.Ternak.findAll({
                attributes: ['id_ternak'],
                where: {
                    qr_id: value.qr_id,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            })
            if(checkTernak.length > 0){
                return {
                    code: 200,
                    data: {
                        id_ternak: checkTernak[0].dataValues.id_ternak,
                        message: 'Ternak Sudah Terdaftar'
                    }
                }
            }

            // Check is premium farm
            if(req.dataAuth && !req.dataAuth.is_premium_farm){
                // Check ternak count
                const ternakCount = await this.db.Ternak.count({where: {id_peternakan: req.dataAuth.id_peternakan}});
                if(ternakCount >= config.premiumFarm.limitTernak) {
                    newError(403, `Maksimal ternak ${config.premiumFarm.limitTernak}, silahkan upgrade ke premium farm`, 'rfid Service');
                }
            } 

            // Get data fase pemasukan
            const idFasePemasukan = await this.db.Fase.findOne({
                attributes: ['id_fp'],
                where: {
                    fase: "Pemasukan"
                }
            });
            if(!idFasePemasukan) newError(404, 'Data Fase Pemasukan tidak ditemukan', 'rfid Service');
            
            // Add New Ternak
            const addTernak = await this.db.Ternak.create({
                qr_id: value.qr_id,
                id_peternakan: req.dataAuth.id_peternakan,
                id_status_ternak: value.jenis_ternak_baru.toLowerCase() == "kelahiran" ? (statusTernakCempe ? statusTernakCempe.dataValues.id_status_ternak : null) : null,
                id_fp: value.jenis_ternak_baru.toLowerCase() == "ternak baru" ? idFasePemasukan.dataValues.id_fp : null
            })
            if(!addTernak) newError(500, 'Gagal menambahkan data ternak baru', 'rfid Service');

            // Create riwayat fase
            if(addTernak.dataValues.id_fp){
                const addRiwayatFase = await this.db.RiwayatFase.create({
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_ternak: addTernak.dataValues.id_ternak,
                    id_fp: addTernak.dataValues.id_fp,
                    tanggal: new Date()
                })
                if(!addRiwayatFase) newError(500, 'Gagal menambahkan data riwayat fase', 'rfid Service');
            }

            return{
                code: 200,
                data: {
                    message: "Ternak berhasil ditambahkan",
                    id_ternak: addTernak.id_ternak
                }
            }
        } catch (error) {
            return errorHandler(error);
        }
    }

    // RFID Get data ternak
    rfidGetTernak = async (req) =>{
        try{
            const schema = joi.object({
                qr_id: joi.string().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'rfid Service');
            // Query data
            const list = await this.db.Ternak.findOne({
                attributes : ['id_ternak', 
                'qr_id', 
                'image', 
                'jenis_kelamin', 
                'id_dam', 
                'id_sire', 
                'tanggal_lahir',
                'tanggal_masuk', 
                'tanggal_keluar', 
                'status_keluar', 
                'createdAt', 
                'updatedAt'],
                include: [
                    {
                        model: this.db.Bangsa,
                        as: 'bangsa',
                        attributes: ['id_bangsa', 'bangsa'],
                        required: false
                    },
                    {
                        model: this.db.Kandang,
                        as: 'kandang',
                        attributes: ['id_kandang', 'kode_kandang', 'id_jenis_kandang', 'persentase_kebutuhan_pakan', 'id_jenis_pakan'],
                        include: [
                            {
                                model: this.db.JenisKandang,
                                as: 'jenis_kandang',
                                attributes: ['id_jenis_kandang', 'jenis_kandang'],
                                required: false
                            },
                            {
                                model: this.db.JenisPakan,
                                as: 'jenis_pakan',
                                attributes: ['id_jenis_pakan', 'jenis_pakan'],
                                required: false
                            }
                        ],
                        required: false
                    },
                    {
                        model: this.db.Kesehatan,
                        as: 'kesehatan',
                        attributes: ['id_kesehatan'],
                        include: [
                            {
                                model: this.db.Penyakit,
                                as: 'penyakit',
                                attributes: ['nama_penyakit'],
                                required: false
                            }
                        ],
                        required: false
                    },
                    {
                        model: this.db.Fase,
                        as: 'fase',
                        attributes: ['id_fp', 'fase'],
                        required: false
                    },
                    {
                        model: this.db.StatusTernak,
                        as: 'status_ternak',
                        attributes: ['id_status_ternak', 'status_ternak'],
                        required: false
                    },
                    {
                        model: this.db.Timbangan,
                        as: 'timbangan',
                        attributes: ['id_timbangan', 'berat', 'suhu'],
                        order: [['createdAt', 'DESC']],
                        limit: 1,
                    },
                ],
                where : {
                    qr_id: value.qr_id
                }
            });
            
            if(!list) newError(404, 'Data Ternak tidak ditemukan', 'rfid Service');
            
            list.dataValues.penyakit = list.dataValues.kesehatan.map((item) => item.dataValues.penyakit.dataValues.nama_penyakit);
            list.dataValues.status_kesehatan = list.dataValues.penyakit.length > 0 ? 'Sakit' : "Sehat";
            list.dataValues.kebutuhan_pakan = ((list.dataValues.timbangan.length > 0 
                ? list.dataValues.timbangan[list.dataValues.timbangan.length - 1].dataValues.berat 
                : 0) * ((list.dataValues.kandang && list.dataValues.kandang.persentase_kebutuhan_pakan 
                    ? list.dataValues.kandang.persentase_kebutuhan_pakan 
                    : 0)/100)).toFixed(2);
            const umurHari =  list.dataValues.tanggal_lahir ? Math.round((new Date() - new Date(list.dataValues.tanggal_lahir))/(1000*60*60*24)) : 0;
            list.dataValues.umur = `${Math.floor(umurHari/30)} bulan ${umurHari%30} hari`;
            list.dataValues.berat = list.dataValues.timbangan.length > 0 ? list.dataValues.timbangan[0].dataValues.berat : 0;
            list.dataValues.suhu = list.dataValues.timbangan.length > 0 ? list.dataValues.timbangan[0].dataValues.suhu : 0;
            delete list.dataValues.kesehatan;
            delete list.dataValues.timbangan;

            return {
                code: 200,
                data: list
            };

        }catch(error){
            return errorHandler(error);
        }
    }
}

module.exports = (db) => new _rfid(db);