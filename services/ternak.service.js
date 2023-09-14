// Helper databse yang dibuat
const DateExtension = require('@joi/date')
const Joi = require('joi');
const joi = Joi.extend(DateExtension);
const { newError, errorHandler } = require('../utils/errorHandler');
const { Op } = require('sequelize');
const { log_info } = require('../utils/logging');
const premiumFarmChecker = require('../utils/premium_farm_checker')
const config = require('../config/app.config')

class _ternak {
    constructor(db) {
        this.db = db;
    }
    // Get Data Ternak
    getTernak = async (req) => {
        try {
            // Filter variable
            // singel parameter
            let start_filter = req.query.age ? (parseInt(req.query.age) - (parseInt(req.query.age) % 10)) : -99999
            let end_filter = req.query.age ? ((parseInt(req.query.age) + (10 - (parseInt(req.query.age) % 10))))-1 : 99999;
            let age = req.query.age ? req.query.age : null
            delete req.query.age;

            log_info('getTernak Service',`start_filter: ${start_filter}, end_filter: ${end_filter}, input_age: ${age}`);

            // multiple parameter
            let start_age = req.query.start_age || -999999;
            delete req.query.start_age;
            let end_age = req.query.end_age || 999999;
            delete req.query.end_age;
            let gestational_age_start = req.query.gestational_age_start || -999999;
            delete req.query.gestational_age_start;
            let gestational_age_end = req.query.gestational_age_end || 999999;
            delete req.query.gestational_age_end;
            let lactation_age_start = req.query.lactation_age_start || -999999;
            delete req.query.lactation_age_start;
            let lactation_age_end = req.query.lactation_age_end || 999999;
            delete req.query.lactation_age_end;

            // Add id_peternakan to params
            req.query.id_peternakan = req.dataAuth.id_peternakan
            req.query.status_keluar = null,
            req.query.tanggal_keluar = null
            // Query data
            const list = await this.db.Ternak.findAll({
                attributes: ['id_ternak',
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
                        required: false
                    },
                    {
                        model: this.db.RiwayatFase,
                        as: 'riwayat_fase',
                        attributes: ['tanggal', 'id_fp'],
                        required: true,
                        order: [['tanggal', 'ASC']],
                        limit: 1,
                    }
                ],
                where: req.query,
                order: [['updatedAt', 'ASC']],
            });

            let fase_kebuntingan;
            let fase_laktasi;
            if(req.query.id_fp){
                // Get data fase kebuntingan
                fase_kebuntingan = await this.db.Fase.findOne({where: {fase: 'Kebuntingan'}})
                if(!fase_kebuntingan) newError(404, 'Fase kebuntingan tidak ditemukan', 'getTernak Service')

                // Get data fase Laktasi
                fase_laktasi = await this.db.Fase.findOne({where: {fase: 'Laktasi'}})
                if(!fase_laktasi) newError(404, 'Fase laktasi tidak ditemukan', 'getTernak Service')
            }

            // Filter data
            for (let i = 0; i < list.length; i++) {
                // Calculate umur
                const umurHari = list[i].dataValues.tanggal_lahir ? Math.round((new Date() - new Date(list[i].dataValues.tanggal_lahir)) / (1000 * 60 * 60 * 24)) : 0;
                list[i].dataValues.umur = `${Math.floor(umurHari / 30)} bulan ${umurHari % 30} hari`;

                // check age single parameter
                if (age && !req.query.id_fp) {
                    if (umurHari < start_filter || umurHari > end_filter) {
                        list.splice(i, 1);
                        i--;
                        continue;
                    }
                }
                if(req.query.id_fp){
                    if(req.query.id_fp == fase_laktasi.dataValues.id_fp){
                        const lactationAge = list[i].dataValues.riwayat_fase.length > 0 ? Math.round((new Date() - new Date(list[i].dataValues.riwayat_fase[0].dataValues.tanggal)) / (1000 * 60 * 60 * 24)) : 0;
                        if (lactationAge < start_filter || lactationAge > end_filter) {
                            list.splice(i, 1);
                            i--;
                            continue;
                        }
                    }else if(req.query.id_fp == fase_kebuntingan.dataValues.id_fp){
                        const gestationalAge = list[i].dataValues.riwayat_fase.length > 0 ? Math.round((new Date() - new Date(list[i].dataValues.riwayat_fase[0].dataValues.tanggal)) / (1000 * 60 * 60 * 24)) : 0;
                        if (gestationalAge < start_filter || gestationalAge > end_filter) {
                            list.splice(i, 1);
                            i--;
                            continue;
                        }
                    }
                }

                // Check umur ternak multiple parameter
                if ((umurHari < start_age || umurHari > end_age)) {
                    list.splice(i, 1);
                    i--;
                    continue;
                }
                // Check lactation age
                if (list[i].dataValues.fase && list[i].dataValues.fase.dataValues.fase === 'Laktasi') {
                    const lactationAge = list[i].dataValues.riwayat_fase.length > 0 ? Math.round((new Date() - new Date(list[i].dataValues.riwayat_fase[list[i].dataValues.riwayat_fase.length - 1].dataValues.tanggal)) / (1000 * 60 * 60 * 24)) : 0;
                    if (lactationAge < lactation_age_start || lactationAge > lactation_age_end) {
                        list.splice(i, 1);
                        i--;
                        continue;
                    }
                }
                // Check gestational age
                if (list[i].dataValues.fase && list[i].dataValues.fase.dataValues.fase === 'Kebuntingan') {
                    const gestationalAge = list[i].dataValues.riwayat_fase.length > 0 ? Math.round((new Date() - new Date(list[i].dataValues.riwayat_fase[list[i].dataValues.riwayat_fase.length - 1].dataValues.tanggal)) / (1000 * 60 * 60 * 24)) : 0;
                    if (gestationalAge < gestational_age_start || gestationalAge > gestational_age_end) {
                        list.splice(i, 1);
                        i--;
                        continue;
                    }
                }

                // Get list penyakit
                list[i].dataValues.penyakit = list[i].dataValues.kesehatan.map((item) => item.dataValues.penyakit.dataValues.nama_penyakit);

                // Get status kesehatan
                list[i].dataValues.status_kesehatan = list[i].dataValues.penyakit.length > 0 ? 'Sakit' : "Sehat";

                // Calculate kebutuhan pakan
                list[i].dataValues.kebutuhan_pakan = ((list[i].dataValues.timbangan.length > 0
                    ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.berat
                    : 0) * ((list[i].dataValues.kandang && list[i].dataValues.kandang.persentase_kebutuhan_pakan
                        ? list[i].dataValues.kandang.persentase_kebutuhan_pakan
                        : 0) / 100)).toFixed(2);
                        
                // Get berat
                list[i].dataValues.berat = list[i].dataValues.timbangan.length > 0 ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.berat : 0;
                
                // Get suhu
                list[i].dataValues.suhu = list[i].dataValues.timbangan.length > 0 ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.suhu : 0;

                // Delete unused data
                delete list[i].dataValues.kesehatan;
                delete list[i].dataValues.timbangan;
                delete list[i].dataValues.riwayat_fase;
            }

            if (list.length <= 0) newError(404, 'Data Ternak tidak ditemukan', 'getTernak Service');

            return {
                code: 200,
                data: {
                    total: list.length,
                    list
                }
            };
        } catch (error) {
            return errorHandler(error);
        }
    }

    // Get Data Ternak mobile
    getTernakMobile = async (req) => {
        try {
            // Filter jenis
            if(req.query.jenis_ternak){
                let status_cempe;
                if(req.query.jenis_ternak.includes('cempe')){
                    status_cempe = await this.db.StatusTernak.findOne({where: {status_ternak: 'Cempe'}});
                    if(!status_cempe) newError(404, 'Status Ternak cempe tidak ditemukan', 'getTernakMobile Service');
                }

                if(req.query.jenis_ternak == 'jantan'){
                    req.query.jenis_kelamin = 'Jantan';
                }else if(req.query.jenis_ternak == 'betina'){
                    req.query.jenis_kelamin = 'Betina';
                }else if(req.query.jenis_ternak == 'cempe-jantan'){
                    req.query.id_status_ternak = status_cempe.dataValues.id_status_ternak;
                    req.query.jenis_kelamin = 'Jantan';
                }else if(req.query.jenis_ternak == 'cempe-betina'){
                    req.query.id_status_ternak = status_cempe.dataValues.id_status_ternak;
                    req.query.jenis_kelamin = 'Betina';
                }else if(req.query.jenis_ternak == 'indukan'){
                    const status_indukan = await this.db.StatusTernak.findOne({where: {status_ternak: 'Indukan'}});
                    if(!status_indukan) newError(404, 'Status Ternak indukan tidak ditemukan', 'getTernakMobile Service');
                    req.query.id_status_ternak = status_indukan.dataValues.id_status_ternak;
                }else if(req.query.jenis_ternak == 'pejantan'){
                    const status_pejantan = await this.db.StatusTernak.findOne({where: {status_ternak: 'Pejantan'}});
                    if(!status_pejantan) newError(404, 'Status Ternak pejantan tidak ditemukan', 'getTernakMobile Service');
                    req.query.id_status_ternak = status_pejantan.dataValues.id_status_ternak;
                }else if(req.query.jenis_ternak == 'kebuntingan'){
                    const fase_kebuntingan = await this.db.Fase.findOne({where: {fase: 'Kebuntingan'}});
                    if(!fase_kebuntingan) newError(404, 'Fase kebuntingan tidak ditemukan', 'getTernakMobile Service');
                    req.query.id_fp = fase_kebuntingan.dataValues.id_fp;
                }else if(req.query.jenis_ternak == 'laktasi'){
                    const fase_laktasi = await this.db.Fase.findOne({where: {fase: 'Laktasi'}});
                    if(!fase_laktasi) newError(404, 'Fase laktasi tidak ditemukan', 'getTernakMobile Service');
                    req.query.id_fp = fase_laktasi.dataValues.id_fp;
                }else{
                    newError(400, 'Jenis Ternak tidak ditemukan', 'getTernakMobile Service');
                }

                delete req.query.jenis_ternak;
            }
            // Filter variable
            let start_filter = req.query.age ? (parseInt(req.query.age) - (parseInt(req.query.age) % 10)) : -99999
            let end_filter = req.query.age ? ((parseInt(req.query.age) + (10 - (parseInt(req.query.age) % 10))))-1 : 99999;
            let age = req.query.age ? req.query.age : null
            delete req.query.age;

            // Add id_peternakan to params
            req.query.id_peternakan = req.dataAuth.id_peternakan
            req.query.status_keluar = null,
            req.query.tanggal_keluar = null
            // Query data
            const list = await this.db.Ternak.findAll({
                attributes: ['id_ternak', 'tanggal_lahir'],
                include: [
                    {
                        model: this.db.Bangsa,
                        as: 'bangsa',
                        attributes: ['id_bangsa', 'bangsa'],
                        required: false
                    },
                    {
                        model: this.db.Timbangan,
                        as: 'timbangan',
                        attributes: ['id_timbangan', 'berat', 'suhu'],
                        required: false
                    },
                    {
                        model: this.db.RiwayatFase,
                        as: 'riwayat_fase',
                        attributes: ['tanggal', 'id_fp'],
                        required: true,
                        order: [['tanggal', 'ASC']],
                        limit: 1,
                    }
                ],
                where: req.query,
                order: [['updatedAt', 'ASC']],
            });

            let fase_kebuntingan;
            let fase_laktasi;
            if(req.query.id_fp){
                // Get data fase kebuntingan
                fase_kebuntingan = await this.db.Fase.findOne({where: {fase: 'Kebuntingan'}})
                if(!fase_kebuntingan) newError(404, 'Fase kebuntingan tidak ditemukan', 'getTernak Service')

                // Get data fase Laktasi
                fase_laktasi = await this.db.Fase.findOne({where: {fase: 'Laktasi'}})
                if(!fase_laktasi) newError(404, 'Fase laktasi tidak ditemukan', 'getTernak Service')
            }

            // Filter data
            for (let i = 0; i < list.length; i++) {
                // Calculate umur
                const umurHari = list[i].dataValues.tanggal_lahir ? Math.round((new Date() - new Date(list[i].dataValues.tanggal_lahir)) / (1000 * 60 * 60 * 24)) : 0;

                // check age single parameter
                if (age && !req.query.id_fp) {
                    if (umurHari < start_filter || umurHari > end_filter) {
                        list.splice(i, 1);
                        i--;
                        continue;
                    }
                }
                if(req.query.id_fp){
                    if(req.query.id_fp == fase_laktasi.dataValues.id_fp){
                        const lactationAge = list[i].dataValues.riwayat_fase.length > 0 ? Math.round((new Date() - new Date(list[i].dataValues.riwayat_fase[0].dataValues.tanggal)) / (1000 * 60 * 60 * 24)) : 0;
                        if (lactationAge < start_filter || lactationAge > end_filter) {
                            list.splice(i, 1);
                            i--;
                            continue;
                        }
                    }else if(req.query.id_fp == fase_kebuntingan.dataValues.id_fp){
                        const gestationalAge = list[i].dataValues.riwayat_fase.length > 0 ? Math.round((new Date() - new Date(list[i].dataValues.riwayat_fase[0].dataValues.tanggal)) / (1000 * 60 * 60 * 24)) : 0;
                        if (gestationalAge < start_filter || gestationalAge > end_filter) {
                            list.splice(i, 1);
                            i--;
                            continue;
                        }
                    }
                }
   
                // Get berat
                list[i].dataValues.berat = list[i].dataValues.timbangan.length > 0 ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.berat : 0;

                // Get bangsa
                list[i].dataValues.bangsa = list[i].dataValues.bangsa ? list[i].dataValues.bangsa.dataValues.bangsa : null;

                // Delete unused data
                delete list[i].dataValues.tanggal_lahir;
                delete list[i].dataValues.timbangan;
                delete list[i].dataValues.riwayat_fase;
            }

            if (list.length <= 0) newError(404, 'Data Ternak tidak ditemukan', 'getTernak Service');

            return {
                code: 200,
                data: {
                    total: list.length,
                    list
                }
            };
        } catch (error) {
            return errorHandler(error);
        }
    }

    // Create new Ternak
    createTernak = async (req) => {
        try {
            // Validate Data
            const schema = joi.object({
                qr_id: joi.string().required(),
                image: joi.string().allow(null),
                jenis_kelamin: joi.string().allow(null),
                id_bangsa: joi.number().allow(null),
                berat: joi.number().allow(null),
                suhu: joi.number().allow(null),
                tanggal_lahir: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
                tanggal_masuk: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
                tanggal_keluar: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
                status_keluar: joi.string().allow(null),
                id_dam: joi.number().allow(null),
                id_sire: joi.number().allow(null),
                id_fp: joi.number().allow(null),
                id_status_ternak: joi.number().allow(null),
                id_kandang: joi.number().allow(null)
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'createTernak Service');

            // Check is premium user
            if(req.dataAuth && !req.dataAuth.is_premium_farm){
                // Check ternak count
                const ternakCount = await this.db.Ternak.count({where: {id_peternakan: req.dataAuth.id_peternakan}});
                console.log(ternakCount)
                if(ternakCount >= config.premiumFarm.limitTernak) {
                    newError(403, `Maksimal ternak ${config.premiumFarm.limitTernak}, silahkan upgrade ke premium`, 'createTernak Service');
                }
            } 

            // Validate tanggal_lahir
            if (value.tanggal_lahir && new Date(value.tanggal_lahir) > new Date()) newError(400, 'Tanggal lahir must be less than today', 'createTernak Service');

            // Validate tanggal_masuk
            if (value.tanggal_masuk && new Date(value.tanggal_masuk) > new Date()) newError(400, 'Tanggal masuk must be less than today', 'createTernak Service');

            // Validate fase
            if(value.jenis_kelamin && value.jenis_kelamin.toLowerCase() == 'jantan' && value.id_fp){
                if(value.id_fp == 7){
                    newError(400, 'Jantan cannot be in fase Waiting List Perkawinan', 'createTernak Service')
                }else if(value.id_fp == 9){
                    newError(400, 'Jantan cannot be in fase Kebuntingan', 'createTernak Service')
                }else if(value.id_fp == 10){
                    newError(400, 'Jantan cannot be in fase Laktasi', 'createTernak Service')
                }
            }

            // Check if Ternak already exist
            const ternak = await this.db.Ternak.findOne({where: {qr_id: value.qr_id}});
            if (ternak) newError(400, 'RFID Ternak sudah terdaftar', 'createTernak Service');

            // Add id_user to params
            value.id_peternakan = req.dataAuth.id_peternakan
            
            // Create new Ternak
            const add = await this.db.Ternak.create({
                qr_id: value.qr_id,
                id_peternakan: req.dataAuth.id_peternakan,
                image: value.image,
                jenis_kelamin: value.jenis_kelamin,
                id_bangsa: value.id_bangsa,
                tanggal_lahir: value.tanggal_lahir,
                tanggal_masuk: value.tanggal_masuk || new Date(),
                tanggal_keluar: value.tanggal_keluar,
                status_keluar: value.status_keluar,
                id_dam: value.id_dam,
                id_sire: value.id_sire,
                id_fp: value.id_fp,
                id_status_ternak: value.id_status_ternak,
                id_kandang: value.id_kandang
            });
            if (!add) newError(500, 'Gagal menambahkan ternak', 'createTernak Service');

            // Create suhu and berat
            if (value.berat || value.suhu) {
                // Add Timbangan
                const timbangan = await this.db.Timbangan.create({
                    id_ternak: add.id_ternak,
                    qr_id: add.qr_id,
                    berat: add.berat ? add.berat : 0,
                    suhu: add.suhu ? add.suhu : 0,
                    tanggal_timbang: new Date(),
                });
                if (!timbangan) newError(500, 'Gagal menambahkan timbangan', 'createTernak Service');
            }

            // Create riwayat fase
            if (value.id_fp) {
                // Add Riwayat Fase
                const riwayat_fase = await this.db.RiwayatFase.create({
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_ternak: add.id_ternak,
                    id_fp: add.id_fp,
                    tanggal: new Date(),
                });
                if (!riwayat_fase) newError(500, 'Gagal menambahkan riwayat fase', 'createTernak Service');
            }

            return {
                code: 200,
                data: {
                    id: add.id_ternak,
                    qr_id: add.qr_id,
                    createdAt: add.createdAt
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Update Ternak
    updateTernak = async (req) => {
        const t = await this.db.sequelize.transaction();
        try {
            const schema = joi.object({
                id_ternak: joi.number().required(),
                qr_id: joi.string().allow(null),
                image: joi.string().allow(null),
                jenis_kelamin: joi.string().allow(null),
                id_bangsa: joi.number().allow(null),
                berat: joi.number().allow(null),
                suhu: joi.number().allow(null),
                tanggal_lahir: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
                tanggal_masuk: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
                tanggal_keluar: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
                status_keluar: joi.string().allow(null),
                id_dam: joi.number().allow(null),
                id_sire: joi.number().allow(null),
                id_fp: joi.number().allow(null),
                id_status_ternak: joi.number().allow(null),
                id_kandang: joi.number().allow(null)
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'updateTernak Service');

            // Validate tanggal_lahir
            if (value.tanggal_lahir && new Date(value.tanggal_lahir) > new Date()) newError(400, 'Tanggal lahir must be less than today', 'createTernak Service');

            // Validate tanggal_masuk
            if (value.tanggal_masuk && new Date(value.tanggal_masuk) > new Date()) newError(400, 'Tanggal masuk must be less than today', 'createTernak Service');

            // Validate fase
            if(value.jenis_kelamin && value.jenis_kelamin.toLowerCase() == 'jantan' && value.id_fp){
                if(value.id_fp == 7){
                    newError(400, 'Jantan cannot be in fase Waiting List Perkawinan', 'createTernak Service')
                }else if(value.id_fp == 9){
                    newError(400, 'Jantan cannot be in fase Kebuntingan', 'createTernak Service')
                }else if(value.id_fp == 10){
                    newError(400, 'Jantan cannot be in fase Laktasi', 'createTernak Service')
                }
            }

            // Check if Ternak exist
            const ternak = await this.db.Ternak.findOne({where: {id_ternak: value.id_ternak, id_peternakan: req.dataAuth.id_peternakan}});
            if (!ternak) newError(404, 'Ternak tidak ditemukan', 'updateTernak Service');

            // Update Ternak
            const update = await this.db.Ternak.update({
                qr_id: value.qr_id || ternak.dataValues.qr_id,
                image: value.image || ternak.dataValues.image,
                jenis_kelamin: value.jenis_kelamin || ternak.dataValues.jenis_kelamin,
                id_bangsa: value.id_bangsa || ternak.dataValues.id_bangsa,
                tanggal_lahir: value.tanggal_lahir || ternak.dataValues.tanggal_lahir,
                tanggal_masuk: value.tanggal_masuk || ternak.dataValues.tanggal_masuk,
                tanggal_keluar: value.tanggal_keluar || ternak.dataValues.tanggal_keluar,
                status_keluar: value.status_keluar || ternak.dataValues.status_keluar,
                id_dam: value.id_dam || ternak.dataValues.id_dam,
                id_sire: value.id_sire || ternak.dataValues.id_sire,
                id_fp: value.id_fp || ternak.dataValues.id_fp,
                id_status_ternak: value.id_status_ternak || ternak.dataValues.id_status_ternak,
                id_kandang: value.id_kandang || ternak.dataValues.id_kandang
            }, {
                where: {
                    id_ternak: value.id_ternak,
                    id_peternakan: req.dataAuth.id_peternakan
                },
                transaction: t
            });
            if (update <= 0) newError(500, 'Gagal update ternak', 'updateTernak Service');

            // Create timbangan
            if (value.berat || value.suhu) {
                // Get latest timbangan
                const latest_timbangan = await this.db.Timbangan.findOne({
                    where: {
                        id_ternak: ternak.dataValues.id_ternak
                    },
                    order: [
                        ['tanggal_timbang', 'DESC']
                    ],
                    limit: 1
                });

                // Add Timbangan
                const timbangan = await this.db.Timbangan.create({
                    id_ternak: ternak.dataValues.id_ternak,
                    qr_id: value.qr_id || ternak.dataValues.qr_id,
                    berat: value.berat || (latest_timbangan && latest_timbangan.dataValues.berat ? latest_timbangan.dataValues.berat : 0),
                    suhu: value.suhu || (latest_timbangan && latest_timbangan.dataValues.suhu ? latest_timbangan.dataValues.suhu : 0),
                    tanggal_timbang: new Date(),
                }, {transaction: t});
                if (!timbangan) newError(500, 'Gagal menambahkan timbangan', 'updateTernak Service');
            }

            // Create riwayat fase
            if (value.id_fp && value.id_fp !== ternak.dataValues.id_fp) {
                // Add Riwayat Fase
                const riwayat_fase = await this.db.RiwayatFase.create({
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_ternak: value.id_ternak,
                    id_fp: value.id_fp,
                    tanggal: new Date(),
                }, {transaction: t});
                if (!riwayat_fase) newError(500, 'Gagal menambahkan riwayat fase', 'updateTernak Service');
            }

            // Commit Transaction
            await t.commit();

            return {
                code: 200,
                data: {
                    id: value.id_ternak,
                    qr_id: value.qr_id,
                    updatedAt: new Date()
                }
            };
        }
        catch (error) {
            await t.rollback();
            return errorHandler(error);
        }
    }

    // Delete Ternak
    deleteTernak = async (req) => {
        try {
            // Validate Data
            const schema = joi.object({
                id_ternak: joi.number().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'deleteTernak Service');

            // Query Data
            const del = await this.db.Ternak.destroy({
                where: {
                    id_ternak: value.id_ternak,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if (del <= 0) newError(500, 'Gagal menghapus ternak', 'deleteTernak Service');

            return {
                code: 200,
                data: {
                    id: value.id_ternak,
                    deletedAt: new Date()
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Ternak Keluar
    ternakKeluar = async (req) => {
        try {
            // Validate Data
            const schema = joi.object({
                id_ternak: joi.number().required(),
                status_keluar: joi.string().required(),
                tanggal_keluar: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'ternakKeluar Service');

            // Update Ternak
            const update = await this.db.Ternak.update({
                status_keluar: value.status_keluar,
                tanggal_keluar: value.tanggal_keluar ? value.tanggal_keluar : new Date(),
                id_kandang: null,
                id_fp: null
            }, {
                where: {
                    id_ternak: value.id_ternak,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if (update <= 0) newError(500, 'Gagal update ternak', 'ternakKeluar Service');

            return {
                code: 200,
                data: {
                    id: value.id_ternak,
                    updatedAt: new Date()
                }
            };
        }
        catch (error) {
            return errorHandler(error);
        }
    }

    // Get data Indukan
    getDataIndukan = async (req) => {
        try {
            // Get data status ternak
            const statusTernak = await this.db.StatusTernak.findOne({
                where: {
                    status_ternak: 'Indukan'
                }
            });
            if (!statusTernak) newError(500, 'Gagal mendapatkan data status ternak', 'getDataIndukan Service');

            // Query Data
            const list = await this.db.Ternak.findAll({
                attributes: ['id_ternak',
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
                    {
                        model: this.db.RiwayatKebuntingan,
                        as: 'riwayat_kebuntingan',
                        attributes: ['status'],
                    }
                ],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_status_ternak: statusTernak.dataValues.id_status_ternak,
                    status_keluar: null,
                    tanggal_keluar: null
                },
                order: [['createdAt', 'DESC']]
            });
            if (list.length <= 0) newError(404, 'Data Ternak Indukan tidak ditemukan', 'getDataIndukan Service');

            // Get data riwayat perkawinan
            const perkawinan = await this.db.RiwayatPerkawinan.findAll({
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    usg: 2
                }
            });
            
            for (let i = 0; i < list.length; i++) {
                list[i].dataValues.penyakit = list[i].dataValues.kesehatan.map((item) => item.dataValues.penyakit.dataValues.nama_penyakit);
                list[i].dataValues.status_kesehatan = list[i].dataValues.penyakit.length > 0 ? 'Sakit' : "Sehat";
                list[i].dataValues.kebutuhan_pakan = ((list[i].dataValues.timbangan.length > 0
                    ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.berat
                    : 0) * ((list[i].dataValues.kandang && list[i].dataValues.kandang.persentase_kebutuhan_pakan
                        ? list[i].dataValues.kandang.persentase_kebutuhan_pakan
                        : 0) / 100)).toFixed(2);
                const umurHari = list[i].dataValues.tanggal_lahir ? Math.round((new Date() - new Date(list[i].dataValues.tanggal_lahir)) / (1000 * 60 * 60 * 24)) : 0;
                list[i].dataValues.umur = `${Math.floor(umurHari / 30)} bulan ${umurHari % 30} hari`;
                list[i].dataValues.berat = list[i].dataValues.timbangan.length > 0 ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.berat : 0;
                list[i].dataValues.suhu = list[i].dataValues.timbangan.length > 0 ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.suhu : 0;
                delete list[i].dataValues.kesehatan;
                delete list[i].dataValues.timbangan;

                // Get total abortus
                list[i].dataValues.totalAbortus = list[i].dataValues.riwayat_kebuntingan.filter((item) => item.dataValues.status.toLowerCase() === 'abortus').length;

                // Get total kebuntingan
                list[i].dataValues.totalKebuntingan = list[i].dataValues.riwayat_kebuntingan.length - list[i].dataValues.totalAbortus;
                delete list[i].dataValues.riwayat_kebuntingan;

                // Get total perkawinan
                list[i].dataValues.totalPerkawinan = perkawinan.filter((item) => item.dataValues.id_indukan === list[i].dataValues.id_ternak).length;

                // Get total tidak bunting
                list[i].dataValues.totalTidakBunting = perkawinan.filter((item) => item.dataValues.status.toLowerCase() === 'tidak bunting').length;
            }

            return {
                code: 200,
                data: {
                    total: list.length,
                    list
                },
            };
        } catch (error) {
            return errorHandler(error);
        }
    }

    // Get data penjantan 
    getDataPejantan = async (req) => {
        try {
            // Get data status ternak
            const statusTernak = await this.db.StatusTernak.findOne({
                where: {
                    status_ternak: 'Pejantan'
                }
            });
            if (!statusTernak) newError(500, 'Gagal mendapatkan data status ternak', 'getDataPejantan Service');

            // Query Data
            const list = await this.db.Ternak.findAll({
                attributes: ['id_ternak',
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
                    }
                ],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_status_ternak: statusTernak.dataValues.id_status_ternak,
                    status_keluar: null,
                    tanggal_keluar: null
                },
                order: [['createdAt', 'DESC']]
            });

            if (list.length <= 0) newError(404, 'Data Ternak Pejantan tidak ditemukan', 'getDataPejantan Service');

            for (let i = 0; i < list.length; i++) {
                list[i].dataValues.penyakit = list[i].dataValues.kesehatan.map((item) => item.dataValues.penyakit.dataValues.nama_penyakit);
                list[i].dataValues.status_kesehatan = list[i].dataValues.penyakit.length > 0 ? 'Sakit' : "Sehat";
                list[i].dataValues.kebutuhan_pakan = ((list[i].dataValues.timbangan.length > 0
                    ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.berat
                    : 0) * ((list[i].dataValues.kandang && list[i].dataValues.kandang.persentase_kebutuhan_pakan
                        ? list[i].dataValues.kandang.persentase_kebutuhan_pakan
                        : 0) / 100)).toFixed(2);
                const umurHari = list[i].dataValues.tanggal_lahir ? Math.round((new Date() - new Date(list[i].dataValues.tanggal_lahir)) / (1000 * 60 * 60 * 24)) : 0;
                list[i].dataValues.umur = `${Math.floor(umurHari / 30)} bulan ${umurHari % 30} hari`;
                list[i].dataValues.berat = list[i].dataValues.timbangan.length > 0 ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.berat : 0;
                list[i].dataValues.suhu = list[i].dataValues.timbangan.length > 0 ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.suhu : 0;
                delete list[i].dataValues.kesehatan;
                delete list[i].dataValues.timbangan;
            }

            return {
                code: 200,
                data: {
                    total: list.length,
                    list
                },
            };
        } catch (error) {
            return errorHandler(error);
        }
    }

    // Get data ternak keluar 
    getTernakKeluar = async (req) => {
        try {
            // Get ternak keluar
            const list = await this.db.Ternak.findAll({
                attributes: ['id_ternak',
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
                        attributes: ['id_timbangan', 'berat'],
                        required: false
                    }
                ],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    status_keluar: {
                        [Op.not]: null
                    },
                    tanggal_keluar: {
                        [Op.not]: null
                    }
                },
                order: [['createdAt', 'DESC']]
            });

            if (list.length <= 0) newError(404, 'Data Ternak keluar tidak ditemukan', 'getTernakKeluar Service');

            for (let i = 0; i < list.length; i++) {
                list[i].dataValues.penyakit = list[i].dataValues.kesehatan.map((item) => item.dataValues.penyakit.dataValues.nama_penyakit);
                list[i].dataValues.status_kesehatan = list[i].dataValues.penyakit.length > 0 ? 'Sakit' : "Sehat";
                list[i].dataValues.kebutuhan_pakan = ((list[i].dataValues.timbangan.length > 0
                    ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.berat
                    : 0) * ((list[i].dataValues.kandang && list[i].dataValues.kandang.persentase_kebutuhan_pakan
                        ? list[i].dataValues.kandang.persentase_kebutuhan_pakan
                        : 0) / 100)).toFixed(2);
                const umurHari = list[i].dataValues.tanggal_lahir ? Math.round((new Date() - new Date(list[i].dataValues.tanggal_lahir)) / (1000 * 60 * 60 * 24)) : 0;
                list[i].dataValues.umur = `${Math.floor(umurHari / 30)} bulan ${umurHari % 30} hari`;
                list[i].dataValues.berat = list[i].dataValues.timbangan.length > 0 ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.berat : 0;
                list[i].dataValues.suhu = list[i].dataValues.timbangan.length > 0 ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.suhu : 0;
                delete list[i].dataValues.kesehatan;
                delete list[i].dataValues.timbangan;
            }

            return {
                code: 200,
                data: {
                    total: list.length,
                    list
                },
            };
        } catch (error) {
            return errorHandler(error);
        }
    }
}

module.exports = (db) => new _ternak(db);