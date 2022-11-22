// Helper databse yang dibuat
const joi = require('joi');
const {log_error, log_info} = require('../utils/logging')
const {newError, errorHandler} = require('../utils/errorHandler');

class _rfid{
    constructor(db){
        this.db = db;
    }
    // Get data rfid
    rfid = async (req) => {
        try {
            // Validate data
            const schema = joi.object({
                rf_id: joi.string().required(),
                id_peternakan: joi.number().required(),
                jenis_ternak_baru: joi.string().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'rfid Service');

            console.log(value.jenis_ternak_baru.toLowerCase() !== "ternak baru" && value.jenis_ternak_baru.toLowerCase() !== "kelahiran");

            // Check jenis ternak baru
            if (value.jenis_ternak_baru.toLowerCase() !== "ternak baru" && value.jenis_ternak_baru.toLowerCase() !== "kelahiran") newError(400, "Jenis Ternak Baru must be 'Ternak Baru' or 'Kelahiran'", 'rfid Service');

            // Get data status ternak cempe
            const statusTernakCempe = await this.db.StatusTernak.findOne({
                where: {
                    status_ternak: "Cempe"
                }
            });
            if(!statusTernakCempe) newError(404, 'Data Status Ternak Cempe not found', 'rfid Service');

            // Check Ternak
            const checkTernak = await this.db.Ternak.findAll({
                attributes: ['id_ternak'],
                where: {
                    rf_id: value.rf_id,
                    id_peternakan: value.id_peternakan
                }
            })
            if(checkTernak.length > 0){
                return {
                    code: 200,
                    data: {
                        id_ternak: checkTernak[0].dataValues.id_ternak,
                        message: 'Ternak Registered'
                    }
                }
            }

            // Get data fase pemasukan
            const idFasePemasukan = await this.db.Fase.findOne({
                attributes: ['id_fp'],
                where: {
                    fase: "Pemasukan"
                }
            });
            if(!idFasePemasukan) newError(404, 'Data Fase Pemasukan not found', 'rfid Service');
            
            // Add New Ternak
            const addTernak = await this.db.Ternak.create({
                rf_id: value.rf_id,
                id_peternakan: value.id_peternakan,
                id_status_ternak: value.jenis_ternak_baru.toLowerCase() == "kelahiran" ? (statusTernakCempe ? statusTernakCempe.dataValues.id_status_ternak : null) : null,
                id_fp: value.jenis_ternak_baru.toLowerCase() == "ternak baru" ? idFasePemasukan.dataValues.id_fp : null
            })
            if(!addTernak) newError(500, 'Failed to create new data ternak', 'rfid Service');

            // Create riwayat fase
            if(addTernak.dataValues.id_fp){
                const addRiwayatFase = await this.db.RiwayatFase.create({
                    id_peternakan: value.id_peternakan,
                    id_ternak: addTernak.dataValues.id_ternak,
                    id_fp: addTernak.dataValues.id_fp,
                    tanggal: new Date()
                })
                if(!addRiwayatFase) newError(500, 'Failed to create new data riwayat fase', 'rfid Service');
            }

            return{
                code: 200,
                data: {
                    message: "Ternak Added",
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
                rf_id: joi.string().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'rfid Service');
            // Query data
            const list = await this.db.Ternak.findOne({
                attributes : ['id_ternak', 
                'rf_id', 
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
                        attributes: ['id_bangsa', 'bangsa']
                    },
                    {
                        model: this.db.Kandang,
                        as: 'kandang',
                        attributes: ['id_kandang', 'kode_kandang', 'id_jenis_kandang', 'persentase_kebutuhan_pakan', 'id_jenis_pakan'],
                        include: [
                            {
                                model: this.db.JenisKandang,
                                as: 'jenis_kandang',
                                attributes: ['id_jenis_kandang', 'jenis_kandang']
                            },
                            {
                                model: this.db.JenisPakan,
                                as: 'jenis_pakan',
                                attributes: ['id_jenis_pakan', 'jenis_pakan']
                            }
                        ]
                    },
                    {
                        model: this.db.Kesehatan,
                        as: 'kesehatan',
                        attributes: ['id_kesehatan'],
                        include: [
                            {
                                model: this.db.Penyakit,
                                as: 'penyakit',
                                attributes: ['nama_penyakit']
                            }
                        ]
                    },
                    {
                        model: this.db.Fase,
                        as: 'fase',
                        attributes: ['id_fp', 'fase']
                    },
                    {
                        model: this.db.StatusTernak,
                        as: 'status_ternak',
                        attributes: ['id_status_ternak', 'status_ternak']
                    },
                    {
                        model: this.db.Timbangan,
                        as: 'timbangan',
                        attributes: ['id_timbangan', 'berat']
                    },
                ],
                where : {
                    rf_id: value.rf_id
                }
            });
            
            if(!list) newError(404, 'Data Ternak not found', 'rfid Service');
            
            list.dataValues.penyakit = list.dataValues.kesehatan.map((item) => item.dataValues.penyakit.dataValues.nama_penyakit);
            list.dataValues.status_kesehatan = list.dataValues.penyakit.length > 0 ? 'Sakit' : "Sehat";
            list.dataValues.kebutuhan_pakan = ((list.dataValues.timbangan.length > 0 
                ? list.dataValues.timbangan[list.dataValues.timbangan.length - 1].dataValues.berat 
                : 0) * ((list.dataValues.kandang && list.dataValues.kandang.persentase_kebutuhan_pakan 
                    ? list.dataValues.kandang.persentase_kebutuhan_pakan 
                    : 0)/100)).toFixed(2);
            const umurHari =  list.dataValues.tanggal_lahir ? Math.round((new Date() - new Date(list.dataValues.tanggal_lahir))/(1000*60*60*24)) : 0;
            list.dataValues.umur = `${Math.floor(umurHari/30)} bulan ${umurHari%30} hari`;
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