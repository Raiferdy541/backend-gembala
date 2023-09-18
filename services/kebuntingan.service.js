const {Op} = require('sequelize');
const {newError, errorHandler} = require('../utils/errorHandler');
const joi = require('joi');
const createHistoryFase = require('./riwayat_fase.service');
const {sequelize} = require('../models');

class _kebuntingan{
    constructor(db){
        this.db = db;
    }
    // Get kandang kebuntingan
    getKandangKebuntingan = async (req) => {
        try{
            // Get data fase kebuntingan
            const faseKebuntingan = await this.db.Fase.findOne({
                attributes: ['id_fp'],
                where: {
                    fase: 'Kebuntingan'
                }
            });
            if(!faseKebuntingan) newError(404, 'Fase Kebuntingan tidak ditemukan', 'getKandangKebuntingan Service');

            // Get ternak in fase kebuntingan
            const ternak = await this.db.Ternak.findAll({
                attributes: ['id_ternak', 'id_kandang'],
                include: [{
                    model: this.db.Kandang,
                    as: 'kandang',
                    attributes: ['id_kandang', 'kode_kandang']
                }],
                where: {
                    id_fp: faseKebuntingan.dataValues.id_fp,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(ternak.length <= 0) newError(404, 'Data Ternak tidak ditemukan', 'getKandangKebuntingan Service');
            
            // Get kandang
            const kandang = await this.db.Kandang.findAll({
                attributes: ['id_kandang', 'kode_kandang'],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(kandang.length <= 0) newError(404, 'Data Kandang tidak ditemukan', 'getKandangKebuntingan Service');
            
            // Get data ternak in kandang
            let dataKandang  = [];
            for(let i = 0; i < kandang.length; i++){
                let ternakInKandang  = 0;
                for(let j = 0; j < ternak.length; j++){
                    if(kandang[i].id_kandang == ternak[j].id_kandang){
                        ternakInKandang++;
                    }
                }
                if(ternakInKandang > 0){
                    dataKandang.push({
                        id_kandang: kandang[i].id_kandang,
                        kode_kandang: kandang[i].kode_kandang,
                        total_ternak: ternakInKandang
                    });
                }
            }

            return{
                code: 200,
                data: {
                    total: dataKandang.length,
                    list: dataKandang
                }
            }

        }catch(error){
            return errorHandler(error);
        }
    }

    // Get data ternak in kandang
    getDataTernakInKandang = async (req) => {
        try{
            // Get data fase kebuntingan
            const faseKebuntingan = await this.db.Fase.findOne({
                attributes: ['id_fp'],
                where: {
                    fase: 'Kebuntingan'
                }
            });
            if(!faseKebuntingan) newError(404, 'Fase Kebuntingan tidak ditemukan', 'getDataTernakInKandang Service');

            // Add params
            req.query.id_fp = faseKebuntingan.dataValues.id_fp;
            req.query.id_peternakan = req.dataAuth.id_peternakan;
            // Get data ternak in kandang
            const ternak = await this.db.Ternak.findAll({
                attributes: ['id_ternak'],
                include: [
                    {
                        model: this.db.Kandang,
                        as: 'kandang',
                        attributes: ['id_kandang', 'kode_kandang']
                    },
                    {
                        model: this.db.RiwayatFase,
                        as: 'riwayat_fase',
                        attributes: ['tanggal']
                    }
                ],
                where: req.query
            });
            if(ternak.length <= 0) newError(404, 'Data Ternak tidak ditemukan', 'getDataTernakInKandang Service');

            for(let i = 0; i < ternak.length; i++){
                ternak[i].dataValues.tanggal = ternak[i].dataValues.riwayat_fase.length > 0 ? ternak[i].dataValues.riwayat_fase[0].tanggal : null;
                delete ternak[i].dataValues.riwayat_fase;
            }

            return{
                code: 200,
                data: {
                    total: ternak.length,
                    list: ternak
                }
            }

        }catch(error){
            return errorHandler(error);
        }
    }

    // Set ternak abortus
    setTernakAbortus = async (req) => {
        const t = await this.db.sequelize.transaction();
        try{
            // Validate data
            const schema = joi.object({
                id_ternak: joi.number().required()
            });
            const {error, value} = schema.validate(req.body);
            if(error) newError(400, error.details[0].message, 'setTernakAbortus Service');

            // Get data fase kebuntingan
            const faseKebuntingan = await this.db.Fase.findOne({attributes: ['id_fp'], where: {fase: 'Kebuntingan'}});
            if(!faseKebuntingan) newError(404, 'Fase Kebuntingan tidak ditemukan', 'setTernakAbortus Service');

            // Get data fase waiting list
            const faseWaitingList = await this.db.Fase.findOne({attributes: ['id_fp'], where: {fase: 'Waiting List Perkawinan'}});
            if(!faseWaitingList) newError(404, 'Fase Waiting List tidak ditemukan', 'setTernakAbortus Service');

            // Get data ternak
            const ternak = await this.db.Ternak.findOne({attributes: ['id_ternak'], where: {id_ternak: value.id_ternak, id_fp: faseKebuntingan.dataValues.id_fp, id_peternakan: req.dataAuth.id_peternakan}});
            if(!ternak) newError(404, 'Data Ternak tidak ditemukan di fase kebuntingan', 'setTernakAbortus Service');

            // get data riwayat fase
            const riwayatFase = await this.db.RiwayatFase.findAll({
                attributes: ['id_riwayat_fase', 'tanggal'],
                where: {id_ternak: value.id_ternak, id_fp: faseKebuntingan.dataValues.id_fp},
                order: [['tanggal', 'DESC']],
                limit: 1
            });
            if(riwayatFase.length <= 0) newError(404, 'Data Riwayat Fase tidak ditemukan', 'setTernakAbortus Service');

            // Get riwayat perkawinan
            const latestRiwayatPerkawinan = await this.db.RiwayatPerkawinan.findAll({
                attributes: ['id_riwayat_perkawinan', 'tanggal_perkawinan', 'id_pejantan'],
                where: {id_indukan: value.id_ternak, id_peternakan: req.dataAuth.id_peternakan},
                order: [['createdAt', 'DESC']],
                limit: 1
            });
            if(latestRiwayatPerkawinan.length <= 0) newError(404, 'Data Riwayat Perkawinan tidak ditemukan', 'setTernakAbortus Service');

            // Check total abortus
            const totalAbortus = await this.db.RiwayatKebuntingan.count({where: {id_indukan: value.id_ternak, status: 'Abortus'}});

            // Get status afkir
            const statusAfkir = await this.db.StatusTernak.findOne({attributes: ['id_status_ternak'], where: {status_ternak: 'Afkir'}});
            if(!statusAfkir) newError(404, 'Status Afkir tidak ditemukan', 'setTernakAbortus Service');

            // Check ternak if ternak afkir
            if(totalAbortus >= 2){
                // Update status ternak
                const updateStatusTernak = await this.db.Ternak.update({
                    id_status_ternak: statusAfkir.dataValues.id_status_ternak,
                    id_fp: null
                },{
                    where: {id_ternak: value.id_ternak, id_peternakan: req.dataAuth.id_peternakan},
                    transaction: t
                });
                if(updateStatusTernak <= 0) newError(500, 'Gagal mengubah status ternak', 'setTernakAbortus Service');
            }else{
                // Update status ternak
                const updateStatusTernak = await this.db.Ternak.update({
                    id_fp: faseWaitingList.dataValues.id_fp
                },{
                    where: {id_ternak: value.id_ternak, id_peternakan: req.dataAuth.id_peternakan},
                    transaction: t
                });
                if(updateStatusTernak <= 0) newError(500, 'Gagal mengubah status ternak', 'setTernakAbortus Service');

                // Create riwayat fase
                const historyFase = await this.db.RiwayatFase.create({
                    id_ternak: value.id_ternak,
                    id_fp: faseWaitingList.dataValues.id_fp,
                    id_peternakan: req.dataAuth.id_peternakan,
                    tanggal: new Date()
                },{transaction: t});
                if(!historyFase) newError(500, 'Gagal membuat riwayat fase', 'setTernakAbortus Service');
            }

            // Create riwayat kebuntingan
            const historyKebuntingan = await this.db.RiwayatKebuntingan.create({
                id_riwayat_perkawinan: latestRiwayatPerkawinan[0].dataValues.id_riwayat_perkawinan,
                id_indukan: value.id_ternak,
                id_pejantan: latestRiwayatPerkawinan[0].dataValues.id_pejantan,
                id_peternakan: req.dataAuth.id_peternakan,
                status: 'Abortus',
                tanggal_perkawinan: latestRiwayatPerkawinan[0].dataValues.tanggal_perkawinan,
                tanggal_kebuntingan: riwayatFase[0].dataValues.tanggal
            },{transaction: t});
            if(!historyKebuntingan) newError(500, 'Gagal membuat riwayat kebuntingan', 'setTernakAbortus Service');

            await t.commit();
            return{
                code: 200,
                data: {
                    id_ternak: value.id_ternak,
                    updatedAt: new Date()
                }
            }
        }catch(error){
            await t.rollback();
            return errorHandler(error);
        }
    }

    // Get data ternak kebuntingan
    getTernakKebuntingan = async (req) => {
        try{
            // Get data fase kebuntingan
            const faseKebuntingan = await this.db.Fase.findOne({
                attributes: ['id_fp'],
                where: {
                    fase: 'Kebuntingan'
                }
            });
            if(!faseKebuntingan) newError(404, 'Fase Kebuntingan tidak ditemukan', 'getTernakKebuntingan Service');
            // Get data ternak
            const ternak = await this.db.Ternak.findAll({
                attributes: ['id_ternak', 'qr_id', 'jenis_kelamin'],
                include: [
                    {
                        model: this.db.Kandang,
                        as: 'kandang',
                        attributes: ['id_kandang', 'kode_kandang']
                    },
                    {
                        model: this.db.Bangsa,
                        as: 'bangsa',
                        attributes: ['id_bangsa', 'bangsa']
                    },
                    {
                        model: this.db.Timbangan,
                        as: 'timbangan',
                        attributes: ['berat', 'suhu']
                    },
                    {
                        model: this.db.RiwayatKebuntingan,
                        as: 'riwayat_kebuntingan',
                        attributes: ['status'],
                    }
                ],
                where: {
                    id_fp: faseKebuntingan.dataValues.id_fp,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });

            // Get total ternak by kandang
            let totalTernakByKandang = [];

            for(let i = 0; i < ternak.length; i++){
                // Get data berat & suhu
                ternak[i].dataValues.berat = ternak[i].dataValues.timbangan.length > 0 ? ternak[i].dataValues.timbangan[ternak[i].dataValues.timbangan.length - 1].dataValues.berat : 0;
                ternak[i].dataValues.suhu = ternak[i].dataValues.timbangan.length > 0 ? ternak[i].dataValues.timbangan[ternak[i].dataValues.timbangan.length - 1].dataValues.suhu : 0;
                delete ternak[i].dataValues.timbangan;

                // Get total abortus
                ternak[i].dataValues.totalAbortus = ternak[i].dataValues.riwayat_kebuntingan.filter((item) => item.dataValues.status.toLowerCase() === 'abortus').length;

                // Get total kebuntingan
                ternak[i].dataValues.totalKebuntingan = ternak[i].dataValues.riwayat_kebuntingan.length - ternak[i].dataValues.totalAbortus;
                delete ternak[i].dataValues.riwayat_kebuntingan;

                // Get total ternak by kandang
                const index = totalTernakByKandang.findIndex((item) => item.id_kandang === ternak[i].dataValues.kandang.dataValues.id_kandang);
                if(index < 0){
                    totalTernakByKandang.push({
                        id_kandang: ternak[i].dataValues.kandang.dataValues.id_kandang,
                        kode_kandang: ternak[i].dataValues.kandang.dataValues.kode_kandang,
                        total: 1
                    });
                }else{
                    totalTernakByKandang[index].total += 1;
                }
            }

            return{
                code: 200,
                data: {
                    kandang: totalTernakByKandang,
                    total: ternak.length,
                    list: ternak
                }
            }
        }catch(error){
            return errorHandler(error);
        }
    }
}

module.exports = (db) => new _kebuntingan(db);