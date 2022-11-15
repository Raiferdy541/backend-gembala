// Helper databse yang dibuat
const joi = require('joi');
const { log_error } = require('../utils/logging');
const createHistoryFase = require('./riwayat_fase.service');
const { newError, errorHandler } = require('../utils/errorHandler');

class _perkawinan {
    constructor(db) {
        this.db = db;
    }
    // Get Ternak in waiting list perkawinan
    getTernakWaitingList = async (req) => {
        try {
            // Get data fase
            const dataFase = await this.db.Fase.findOne({
                attributes: ['id_fp'],
                where: {
                    fase: "Waiting List Perkawinan"
                }
            });
            if (!dataFase) newError(404, 'Data Fase not found', 'getTernakWaitingList Service');

            // Get ternak in waiting list perkawinan
            const ternakWaitingList = await this.db.Ternak.findAll({
                attributes: ['id_ternak'],
                include: [
                    {
                        model: this.db.Kandang,
                        as: 'kandang',
                        attributes: ['id_kandang','kode_kandang']
                    },
                    {
                        model: this.db.RiwayatFase,
                        as: 'riwayat_fase',
                        attributes: ['tanggal'],
                        where: {
                            id_fp: dataFase.dataValues.id_fp
                        },
                    }
                ],
                where: {
                    id_fp: dataFase.dataValues.id_fp,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            for(let i = 0; i < ternakWaitingList.length; i++){
                ternakWaitingList[i].dataValues.tanggal = ternakWaitingList[i].dataValues.riwayat_fase ? ternakWaitingList[i].dataValues.riwayat_fase[0].tanggal : null;
                delete ternakWaitingList[i].dataValues.riwayat_fase;
            }
            if (ternakWaitingList.length <= 0) newError(404, 'Data Ternak Waiting List Perkawinan not found', 'getTernakWaitingList Service');

            return {
                code: 200,
                data: ternakWaitingList
            }
        } catch (error) {
            errorHandler(error);
        }
    }

    // Create Process Perkawinan
    createPerkawinan = async (req) => {
        // Create transaction
        const t = await this.db.sequelize.transaction();
        try{
            // Validate data
            const schema = joi.object({
                id_indukan: joi.number().required(),
                id_pejantan: joi.number().required()
            });
            const {error, value} = schema.validate(req.body);
            if(error) newError(400, error.details[0].message, 'createPerkawinan Service');

            // Get data fase
            const idFasePerkawinan = await this.db.Fase.findOne({
                attributes: ['id_fp'],
                where: {
                    fase: "Perkawinan"
                }
            });
            if(!idFasePerkawinan) newError(404, 'Data Fase not found', 'createPerkawinan Service');

            // Get data ternak indukan
            const dataIndukan = await this.db.Ternak.findOne({
                attributes: ['id_ternak','id_fp'],
                where: {
                    id_ternak: value.id_indukan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(!dataIndukan){
                newError(404, 'Data Ternak Indukan not found', 'createPerkawinan Service');
            }else if(dataIndukan.dataValues.id_fp == idFasePerkawinan.dataValues.id_fp){
                newError(400, 'Ternak Indukan already in fase perkawinan', 'createPerkawinan Service');
            }

            // Get data ternak pejantan
            const dataPejantan = await this.db.Ternak.findOne({
                attributes: ['id_ternak','id_fp', 'id_kandang'],
                where: {
                    id_ternak: value.id_pejantan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(!dataPejantan){
                newError(404, 'Data Ternak Pejantan not found', 'createPerkawinan Service');
            }else if(dataPejantan.dataValues.id_fp != idFasePerkawinan.dataValues.id_fp){
                newError(400, 'Ternak Pejantan not in fase perkawinan', 'createPerkawinan Service');
            }

            // Check ternak indukan and pejantan
            if(dataIndukan.dataValues.id_ternak == dataPejantan.dataValues.id_dam){
                newError(400, `Perkawinan tidak bisa dilakukan, ternak ${dataIndukan.dataValues.id_ternak} adalah 'Dam' ternak ${dataPejantan.dataValues.id_ternak}`, 'createPerkawinan Service');
            }else if(dataIndukan.dataValues.id_sire == dataPejantan.dataValues.id_ternak){
                newError(400, `Perkawinan tidak bisa dilakukan, ternak ${dataIndukan.dataValues.id_ternak} adalah 'Sire' ternak ${dataPejantan.dataValues.id_ternak}`, 'createPerkawinan Service');
            }

            // Create Perkawinan
            const createPerkawinan = await this.db.Perkawinan.create({
                id_indukan: dataIndukan.dataValues.id_ternak,
                id_pejantan: dataPejantan.dataValues.id_ternak,
                id_peternakan: req.dataAuth.id_peternakan,
                id_kandang: dataPejantan.dataValues.id_kandang,
                tanggal_perkawinan: new Date()
            });
            if(!createPerkawinan) newError(500, 'Failed to create Perkawinan', 'createPerkawinan Service');
            
            // Update ternak indukan
            const updateIndukan = await this.db.Ternak.update({
                id_fp: idFasePerkawinan.dataValues.id_fp,
                id_kandang: dataPejantan.dataValues.id_kandang
            },{
                where: {
                    id_ternak: dataIndukan.dataValues.id_ternak
                }
            },{transaction: t});
            if(!updateIndukan) newError(500, 'Failed to update Ternak Indukan', 'createPerkawinan Service');

            // Create riwayat fase ternak indukan
            const historyFaseIndukan = await createHistoryFase(this.db, req, {
                id_ternak: dataIndukan.dataValues.id_ternak,
                id_fp: idFasePerkawinan.dataValues.id_fp
            },{transaction: t});
            if(!historyFaseIndukan) newError(500, 'Failed to create history fase Ternak Indukan', 'createPerkawinan Service');

            await t.commit();
            return {
                code: 200,
                data: {
                    id_perkawinan: createPerkawinan.dataValues.id_perkawinan,
                    id_indukan: createPerkawinan.dataValues.id_indukan,
                    id_pejantan: createPerkawinan.dataValues.id_pejantan,
                    createdAt: createPerkawinan.dataValues.createdAt,
                }
            }

        }catch(error){
            await t.rollback();
            errorHandler(error);
        }
    }

    // Get Process Perkawinan
    getPerkawinan = async (req) => {
        try{
            // Add where condition
            req.query.id_peternakan = req.dataAuth.id_peternakan;
            // get data perkawinan
            const dataPerkawinan = await this.db.Perkawinan.findAll({
                attributes: ['id_perkawinan', 'id_indukan', 'id_pejantan', 'id_peternakan', 'id_kandang', 'tanggal_perkawinan', 'usg_1', 'usg_2', 'status'],
                include: [
                    {
                        model: this.db.Kandang,
                        as: 'kandang',
                        attributes: ['id_kandang', 'kode_kandang']
                    }
                ],
                where: req.query
            });
            if(dataPerkawinan.length <= 0) newError(404, 'Data Perkawinan not found', 'getPerkawinan Service');

            return {
                code: 200,
                data: {
                    total: dataPerkawinan.length,
                    data: dataPerkawinan
                }
            }
        }catch(error){
            errorHandler(error);
        }
    }

    // Update Process Perkawinan
    updatePerkawinan = async (req) => {
        // Start transaction
        const t = await this.db.sequelize.transaction();
        try{
            // Schema validation
            const schema = joi.object({
                id_perkawinan: joi.number().required(),
                status: joi.number().required(),
                id_kandang: joi.number().required(),
                usg_1: joi.boolean().required(),
                usg_2: joi.boolean().required()
            });
            const {error, value} = schema.validate(req.body);
            if(error) newError(400, error.details[0].message, 'updatePerkawinan Service');

            // Check USG
            if(value.usg_1 == true && value.usg_2 == true){
                newError(400, 'Can\'t update USG 1 and USG 2 at the same time', 'updatePerkawinan Service');
            }else if(value.usg_1 == false && value.usg_2 == true){
                newError(400, 'Can\'t update USG 2 before USG 1', 'updatePerkawinan Service');
            }

            // Check data perkawinan
            const dataPerkawinan = await this.db.Perkawinan.findOne({
                attributes: ['id_perkawinan', 'id_indukan', 'id_pejantan', 'id_peternakan', 'id_kandang', 'tanggal_perkawinan', 'usg_1', 'usg_2', 'status'],
                where: {
                    id_perkawinan: value.id_perkawinan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(!dataPerkawinan) newError(404, 'Data Perkawinan not found', 'updatePerkawinan Service');

            // Update perkawinan
            const updatePerkawinan = await this.db.Perkawinan.update({
                status: value.status,
                id_kandang: value.id_kandang,
                usg_1: value.usg_1,
                usg_2: value.usg_2
            },{
                where: {
                    id_perkawinan: value.id_perkawinan,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            },{transaction: t});
            if(updatePerkawinan <= 0) newError(500, 'Failed to update Perkawinan', 'updatePerkawinan Service');

            // Create Riwayat Fase usg1
            if(value.usg_1 == true && dataPerkawinan.dataValues.usg_1 == false){
                // Create riwayat perkawinan
                const riwayatPerkawinanUsg1 = this.db.RiwayatPerkawinan.create({
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_kandang: value.id_kandang,
                    id_indukan: dataPerkawinan.dataValues.id_indukan,
                    id_pejantan: dataPerkawinan.dataValues.id_pejantan,
                    tanggal_perkawinan: dataPerkawinan.dataValues.tanggal_perkawinan,
                    status: value.status,
                    usg: 1
                },{transaction: t});
                if(!riwayatPerkawinanUsg1) newError(500, 'Failed to create Riwayat Perkawinan USG 1', 'updatePerkawinan Service');
            }
            
            // Create Riwayat Fase usg2
            if(value.usg_2 == true && dataPerkawinan.dataValues.usg_2 == false && dataPerkawinan.dataValues.usg_1 == true){
                // Create riwayat perkawinan
                const riwayatPerkawinanUsg2 = this.db.RiwayatPerkawinan.create({
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_kandang: value.id_kandang,
                    id_indukan: dataPerkawinan.dataValues.id_indukan,
                    id_pejantan: dataPerkawinan.dataValues.id_pejantan,
                    tanggal_perkawinan: dataPerkawinan.dataValues.tanggal_perkawinan,
                    status: value.status,
                    usg: 2
                },{transaction: t});
                if(!riwayatPerkawinanUsg2) newError(500, 'Failed to create Riwayat Perkawinan USG 2', 'updatePerkawinan Service');

                
                // Get data fase kebuntingan
                const dataFaseKebuntingan = await this.db.Fase.findOne({  
                    attributes: ['id_fase', 'fase'],
                    where: {
                        fase: 'Kebuntingan'
                    }
                });
                if(!dataFaseKebuntingan) newError(404, 'Data Fase Kebuntingan not found', 'updatePerkawinan Service');

                // Get data fase waiting list perkawinan
                const dataFaseWaitingListPerkawinan = await this.db.Fase.findOne({
                    attributes: ['id_fase', 'fase'],
                    where: {
                        fase: 'Waiting List Perkawinan'
                    }
                });
                if(!dataFaseWaitingListPerkawinan) newError(404, 'Data Fase Waiting List Perkawinan not found', 'updatePerkawinan Service');

                // Update Fase Indukan
                const updateFaseIndukan = await this.db.Indukan.update({
                    id_fp: value.status == 'Bunting' ? dataFaseKebuntingan.dataValues.id_fase : dataFaseWaitingListPerkawinan.dataValues.id_fase
                },{
                    where: {
                        id_indukan: dataPerkawinan.dataValues.id_indukan,
                        id_peternakan: req.dataAuth.id_peternakan
                    }
                },{transaction: t});
                if(updateFaseIndukan <= 0) newError(500, 'Failed to update Fase Indukan', 'updatePerkawinan Service');

                // Create Riwayat Fase Indukan
                const historyFaseIndukan = await createHistoryFase(req, this.db, {
                    id_indukan: value.id_indukan,
                    id_fase: value.status == 'Bunting' ? dataFaseKebuntingan.dataValues.id_fase : dataFaseWaitingListPerkawinan.dataValues.id_fase
                })
                if(!historyFaseIndukan) newError(500, 'Failed to create Riwayat Fase Indukan', 'updatePerkawinan Service');
            }
                
                
            // Commit transaction
            await t.commit();
            

        }catch(error){
            // Rollback transaction
            await t.rollback();
            return errorHandler(error);
        }
    }
}

module.exports = (db) => new _perkawinan(db);