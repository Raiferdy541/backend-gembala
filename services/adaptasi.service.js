// Helper databse yang dibuat
const joi = require('joi');
const { Op } = require('sequelize');
const createHistoryFase = require('./riwayat_fase.service');
const {newError, errorHandler} = require('../utils/errorHandler');

class _adaptasi{
    constructor(db){
        this.db = db;
    }
    /// Get Data adaptasi complete data
    getAdaptasiComplete = async (req) => {
        try{
            // add id_peternakan, id_ternak to query
            req.query.id_peternakan = req.dataAuth.id_peternakan;
            // Query Data
            const list = await this.db.Adaptasi.findAll({ 
                attributes: ['id_adaptasi', 'tanggal_adaptasi'],
                include: [
                    {
                        model: this.db.Ternak,
                        as: 'ternak',
                        attributes: ['id_ternak', 'qr_id']
                    },
                    {
                        model: this.db.Treatment,
                        as: 'treatment',
                        attributes: ['id_treatment', 'step', 'treatment']
                    }
                ],
                where : req.query });
            if(list.length <= 0){
                newError(404, 'Data Adaptasi tidak ditemukan', 'getAdaptasi');
            }
            return {
                code: 200,
                data: {
                    total: list.length,
                    list
                }
            };
        }catch(error){
            return errorHandler(error);
        }
    }

    /// Get Data adaptasi main data
    getAdaptasiMain = async (req) => {
        try{
            // add id_peternakan, id_ternak to query
            req.query.id_peternakan = req.dataAuth.id_peternakan;
            // Query Data
            const list = await this.db.Adaptasi.findAll({ 
                attributes: ['tanggal_adaptasi'],
                include: [
                    {
                        model: this.db.Treatment,
                        as: 'treatment',
                        attributes: ['id_treatment', 'step', 'treatment']
                    }
                ],
                where : req.query 
            });
            for(let i = 0; i < list.length; i++){
                list[i].dataValues.treatment = list[i].dataValues.treatment.dataValues.treatment;
            }
            if(list.length <= 0){newError(404, 'Data Adaptasi tidak ditemukan', 'getAdaptasi')}

            return {
                code: 200,
                data: {
                    total: list.length,
                    list
                }
            };
        }catch(error){
            return errorHandler(error);
        }
    }

    /// Get Data adaptasi by step
    getAdaptasiByStep = async (req) => {
        try{
            // Check query params
            if(!req.query.step){
                newError(400, 'Step tidak boleh kosong', 'getAdaptasiByStep');
            }else if(req.query.step < 1 || req.query.step > 5){
                newError(400, 'Step harus diantara 1 - 5', 'getAdaptasiByStep');
            }

            // Get data ternak by step adaptasi
            const ternakByStepAdaptasi = await this.db.Ternak.findAll({
                attributes: ['id_ternak', 'qr_id'],
                include: [
                    {
                        model: this.db.Kandang,
                        as: 'kandang',
                        attributes: ['id_kandang', 'kode_kandang']
                    },
                    {
                        model: this.db.Adaptasi,
                        as: 'adaptasi',
                        attributes: ['id_adaptasi', 'tanggal_adaptasi'],
                        include: [
                            {
                                model: this.db.Treatment,
                                as: 'treatment',
                                attributes: ['id_treatment', 'step', 'treatment']
                            }
                        ],
                        order: [
                            ['tanggal_adaptasi', 'DESC']
                        ],
                    }
                ],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_fp: {
                        [Op.not]: null
                    }
                }
            });
            if(ternakByStepAdaptasi.length <= 0){
                newError(404, 'Data Ternak tidak ditemukan', 'getAdaptasiByStep');
            }

            // Filter data by step
            for(let i = 0; i < ternakByStepAdaptasi.length; i++){
                if(ternakByStepAdaptasi[i].dataValues.adaptasi.length > 0){
                    for(let j = 0; j < ternakByStepAdaptasi[i].dataValues.adaptasi.length; j++){
                        if(ternakByStepAdaptasi[i].dataValues.adaptasi[j].treatment.step != req.query.step){
                            ternakByStepAdaptasi[i].dataValues.adaptasi.splice(j, 1);
                            j--;
                        }
                    }
                }
                if(ternakByStepAdaptasi[i].dataValues.adaptasi.length <= 0){
                    ternakByStepAdaptasi.splice(i, 1);
                    i--;
                }
            }

            // Get treatment by step
            const treatmentByStep = await this.db.Treatment.findAll({
                attributes: ['id_treatment', 'treatment'],
                where: {
                    step: req.query.step
                }
            });
            if(treatmentByStep.length <= 0){
                newError(404, 'Treatment tidak ditemukan', 'getAdaptasiByStep');
            }

            // Check if ternak has treatment and add tanggal_adaptasi
            for(let i = 0; i < ternakByStepAdaptasi.length; i++){
                ternakByStepAdaptasi[i].dataValues.treatments = {};
                ternakByStepAdaptasi[i].dataValues.tanggal_adaptasi = ternakByStepAdaptasi[i].dataValues.adaptasi[0].dataValues.tanggal_adaptasi;
                for(let j = 0; j < treatmentByStep.length; j++){
                    for(let k = 0; k < ternakByStepAdaptasi[i].dataValues.adaptasi.length; k++){
                        ternakByStepAdaptasi[i].dataValues.treatments[treatmentByStep[j].dataValues.treatment] = ternakByStepAdaptasi[i].dataValues.adaptasi[k].treatment.id_treatment == treatmentByStep[j].dataValues.id_treatment ? true : false;
                        if(ternakByStepAdaptasi[i].dataValues.treatments[treatmentByStep[j].dataValues.treatment]){
                            break;
                        }
                    }
                }
                delete ternakByStepAdaptasi[i].dataValues.adaptasi;
            }

            if(ternakByStepAdaptasi.length <= 0){
                newError(404, 'Data Ternak tidak ditemukan', 'getAdaptasiByStep');
            }
            
            return{
                code: 200,
                data: {
                    total: ternakByStepAdaptasi.length,
                    list: ternakByStepAdaptasi
                }
            }
        }catch (error){
            return errorHandler(error);
        }
    }

    /// Create Data adaptasi
    createAdaptasi = async (req) => {
        try{
            // Validate Data
            const schema = joi.object({
                id_ternak: joi.number().required(),
                id_kandang: joi.number().required(),
                treatments: joi.array().items(joi.object({
                    id_treatment: joi.number().allow(null),
                    step: joi.number().allow(null),
                    treatment: joi.string().allow(null),
                })).required()
            });
            const {error, value} = schema.validate(req.body);
            if(error){
                newError(400, error.details[0].message, 'createAdaptasi');
            }
            if(value.treatments.length <= 0){
                newError(400, 'Treatments tidak boleh kosong', 'createAdaptasi');
            }

            // Check data ternak
            const ternak = await this.db.Ternak.findOne({
                include: [
                    {
                        model: this.db.Kandang,
                        as: 'kandang',
                        attributes: ['id_kandang', 'kode_kandang']
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
                    }
                ],
                where: {
                    id_ternak: value.id_ternak,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if(!ternak){
                newError(404, 'Data Ternak tidak ditemukan', 'createAdaptasi');
            }

            // Check ternak fase
            if(!ternak.dataValues.fase.dataValues.fase.startsWith('Adaptasi')){
                newError(400, 'Ternak tidak dalam fase adaptasi', 'createAdaptasi');
            }

            // Create treatment apllied
            let countTreatment = 0;
            for(let i = 0; i < value.treatments.length; i++){
                if(value.treatments[i].id_treatment != null && value.treatments[i].step != null && value.treatments[i].treatment != null){
                    if(value.treatments[i].step != parseInt(ternak.dataValues.fase.dataValues.fase.split(' ')[1])){
                        newError(400, 'Treatment step tidak sesuai dengan fase ternak', 'createAdaptasi');
                    }
                    countTreatment++;
                    const createAdaptasi = await this.db.Adaptasi.create({
                        id_peternakan: req.dataAuth.id_peternakan,
                        id_ternak: value.id_ternak,
                        id_treatment: value.treatments[i].id_treatment,
                        id_kandang: value.id_kandang,
                        tanggal_adaptasi: new Date()
                    });
                    if(!createAdaptasi){
                        newError(500, 'Gagal menambahkan data adaptasi', 'createAdaptasi');
                    }
                }
            }
            if(countTreatment <= 0){
                newError(400, 'Treatment tidak boleh kosong', 'createAdaptasi');
            }

            // update fase ternak
            if(ternak.dataValues.fase && parseInt(ternak.dataValues.fase.dataValues.fase.split(' ')[1]) < 5){
                let stepAdaptasi = `adaptasi ${parseInt(ternak.dataValues.fase.fase.split(' ')[1]) + 1}`;
                const getIdFase = await this.db.Fase.findOne({
                    attributes: ['id_fp'],
                    where: {
                        fase: stepAdaptasi
                    }
                });
                if(!getIdFase){
                    newError(404, 'Fase tidak ditemukan', 'createAdaptasi');
                }
                const updateFase = await this.db.Ternak.update({
                    id_fp: getIdFase.dataValues.id_fp,
                    id_kandang: value.id_kandang
                },{
                    where: {
                        id_ternak: value.id_ternak,
                        id_peternakan: req.dataAuth.id_peternakan
                    }
                });
                if(!updateFase){
                    newError(500, 'Gagal mengubah fase ternak', 'createAdaptasi');
                }

                // Create History Fase
                const historyFase = await createHistoryFase(this.db, req, {
                    id_ternak: value.id_ternak,
                    id_fp: getIdFase.dataValues.id_fp
                })
                if(!historyFase){
                    newError(500, 'Gagal membuat riwayat fase', 'createAdaptasi');
                }
                
            }else if(ternak.dataValues.fase && parseInt(ternak.dataValues.fase.dataValues.fase.split(' ')[1]) == 5){
                // get id fase waiting list perkawinan
                const getIdFasePrePerkawinan = await this.db.Fase.findOne({
                    attributes: ['id_fp'],
                    where: {
                        fase: 'Waiting List Perkawinan'
                    }
                });
                if(!getIdFasePrePerkawinan){
                    newError(404, 'Fase Waiting List Perkawinan tidak ditemukan', 'createAdaptasi');
                }

                // Get id fase perkawinan
                const getIdFasePerkawinan = await this.db.Fase.findOne({
                    attributes: ['id_fp'],
                    where: {
                        fase: "Perkawinan"
                    }
                })
                if(!getIdFasePerkawinan){
                    newError(404, 'Fase Perkawinan tidak ditemukan', 'createAdaptasi');
                }

                // Update fase ternak
                const updateFase = await this.db.Ternak.update({
                    id_fp: ternak.dataValues.status_ternak.dataValues.status_ternak.toLowerCase() == 'indukan' ? getIdFasePrePerkawinan.dataValues.id_fp : getIdFasePerkawinan.dataValues.id_fp,
                    id_kandang: value.id_kandang
                },{
                    where: {
                        id_ternak: value.id_ternak,
                        id_peternakan: req.dataAuth.id_peternakan
                    }
                });
                if(!updateFase){
                    newError(500, 'Gagal mengubah fase ternak', 'createAdaptasi');
                }

                // Create History Fase
                const historyFase = await createHistoryFase(this.db, req, {
                    id_ternak: value.id_ternak,
                    id_fp: ternak.dataValues.status_ternak.dataValues.status_ternak.toLowerCase() == 'indukan' ? getIdFasePrePerkawinan.dataValues.id_fp : getIdFasePerkawinan.dataValues.id_fp
                })
                if(!historyFase){
                    newError(500, 'Gagal membuat riwayat fase', 'createAdaptasi');
                }
            }else{
                newError(400, 'Ternak tidak di fase adaptasi', 'createAdaptasi');
            }

            return {
                code: 200,
                data: {
                    message: 'Success to create adaptasi'
                }
            }
        }catch(error){
            return errorHandler(error);
        }
    }

    /// Get ternak by fase adaptasi
    getTernakByStep = async (req) => {
        try{
            if(!req.query.step){newError(400, 'Step tidak boleh kosong', 'getTernakByStep')};
            if(req.query.step < 1 || req.query.step > 5){newError(400, 'Step tidak valid', 'getTernakByStep')};

            // get data fase
            const fase = await this.db.Fase.findOne({
                attributes: ['id_fp'],
                where: {
                    fase: `Adaptasi ${req.query.step}`
                }
            });
            if(!fase){newError(404, 'Fase tidak ditemukan', 'getTernakByStep')};

            // Query Data
            const list = await this.db.Ternak.findAll({ 
                attributes: ['id_ternak', 'qr_id'],
                include: [
                    {
                        model: this.db.RiwayatFase,
                        as: 'riwayat_fase',
                        attributes: ['tanggal', 'id_fp'],
                    },
                    {
                        model: this.db.Kandang,
                        as: 'kandang',
                        attributes: ['id_kandang', 'kode_kandang'],
                    }
                ],
                where : {
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_fp: fase.dataValues.id_fp
                } });
            if(list.length <= 0){newError(404, 'Data Ternak Tidak Ditemukan', 'getTernakByStep')};

            // Get fase adaptasi 1
            const faseAdaptasi1 = await this.db.Fase.findOne({
                attributes: ['id_fp'],
                where: {
                    fase: 'Adaptasi 1'
                }
            });
            if(!faseAdaptasi1){newError(404, 'Fase Adaptasi 1 tidak ditemukan', 'getTernakByStep')};

            // Ambil riwayat fase pertama kali
            for(let i = 0; i < list.length; i++){
                // filter data riwayat fase adaptasi 1
                list[i].dataValues.riwayat_fase = list[i].dataValues.riwayat_fase.length > 0 
                    ? list[i].dataValues.riwayat_fase.filter((value) => {
                        return value.dataValues.id_fp == faseAdaptasi1.dataValues.id_fp
                    }) 
                    : [];

                // add date adaptasi 1
                list[i].dataValues.tanggal = list[i].dataValues.riwayat_fase.length > 0 ? list[i].dataValues.riwayat_fase[0].dataValues.tanggal : null;
                delete list[i].dataValues.riwayat_fase
            }

            return {
                code: 200,
                data: {
                    total: list.length,
                    list
                }
            };
        }catch (error){
            return errorHandler(error);
        }
    }

    /// Get all ternak in adaptasi fase
    getAllTernakInAdaptasi = async (req) => {
        try{
            const list = await this.db.Ternak.findAll({ 
                attributes: ['id_ternak', 'qr_id', 'jenis_kelamin'],
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
                where : {
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_fp: {
                        [Op.gte]: 1,
                        [Op.lte]: 5
                    }
                } 
            });
            if(list.length <= 0){
                newError(404, 'Data Ternak tidak ditemukan', 'getAllTernakInAdaptasi');
            }

            let totalByKandang = {}

            for(let i = 0; i < list.length; i++){
                list[i].dataValues.perlakuan = list[i].dataValues.fase.fase.split(' ')[1];
                list[i].dataValues.kode_kandang = list[i].dataValues.kandang ? list[i].dataValues.kandang.dataValues.kode_kandang : null;
                list[i].dataValues.bangsa = list[i].dataValues.bangsa ? list[i].dataValues.bangsa.dataValues.bangsa : null;
                list[i].dataValues.berat = list[i].dataValues.timbangan.length > 0 ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.berat : null;
                list[i].dataValues.suhu = list[i].dataValues.timbangan.length > 0 ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].dataValues.suhu : null;
                delete list[i].dataValues.timbangan;
                delete list[i].dataValues.fase;
                delete list[i].dataValues.kandang;

                if(list[i].dataValues.kode_kandang != null){
                    totalByKandang[list[i].dataValues.kode_kandang] ? totalByKandang[list[i].dataValues.kode_kandang]++ : totalByKandang[list[i].dataValues.kode_kandang] = 1;
                }
            }

            const ternakBetina = list.filter((item) => item.dataValues.jenis_kelamin != null && item.dataValues.jenis_kelamin.toLowerCase() == 'betina');
            const ternakJantan = list.filter((item) => item.dataValues.jenis_kelamin != null && item.dataValues.jenis_kelamin.toLowerCase() == 'jantan');

            return {
                code: 200,
                data: {
                    total: list.length,
                    ternak_betina: ternakBetina.length,
                    ternak_jantan: ternakJantan.length,
                    total_per_kandang: totalByKandang,
                    list
                }
            };
        }catch (error){
            return errorHandler(error);
        }
    }
}

module.exports = (db) => new _adaptasi(db);