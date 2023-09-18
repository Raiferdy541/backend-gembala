// Helper databse yang dibuat
const {newError, errorHandler} = require('../utils/errorHandler');
const { Op } = require('sequelize')

class _formInput{
    constructor(db){
        this.db = db;
    }
    // Get Status Ternak
    getDataFormInput = async (req) => {
        try{
            // Get status ternak
            const statusTernak = await this.db.StatusTernak.findAll({});

            // Get kode kandang
            const kodeKandang = await this.db.Kandang.findAll({
                attributes: ['id_kandang','kode_kandang'],
                include: [
                    {
                        model: this.db.JenisKandang,
                        as: 'jenis_kandang',
                        attributes: ['jenis_kandang']
                    }
                ],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            for(let i = 0; i < kodeKandang.length; i++){
                kodeKandang[i].dataValues.jenis_kandang = kodeKandang[i].dataValues.jenis_kandang.jenis_kandang;
            }

            // Get jenis pakan
            const jenisPakan = await this.db.JenisPakan.findAll({
                attributes: ['id_jenis_pakan','jenis_pakan'],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });

            // Get penyakit
            const penyakit = await this.db.Penyakit.findAll({
                attributes: ['id_penyakit','nama_penyakit'],
            });

            // Get jenis kandang
            const jenisKandang = await this.db.JenisKandang.findAll({
                attributes: ['id_jenis_kandang','jenis_kandang']
            });

            // Get bangsa
            const bangsa = await this.db.Bangsa.findAll({
                attributes: ['id_bangsa','bangsa']
            });
            
            // Get status ternak indukan
            const statusIndukan = await this.db.StatusTernak.findOne({where: {status_ternak: 'Indukan'}});
            if(!statusIndukan) newError(404, 'Data Status Ternak Indukan tidak ditemukan', 'getDataFormInput Service');

            // Get status ternak pejantan
            const statusPejantan = await this.db.StatusTernak.findOne({where: {status_ternak: 'Pejantan'}});
            if(!statusPejantan) newError(404, 'Data Status Ternak Pejantan tidak ditemukan', 'getDataFormInput Service');

            // Get data indukan
            const indukan = await this.db.Ternak.findAll({
                attributes: ['id_ternak','qr_id'],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    jenis_kelamin: 'betina',
                    id_status_ternak: statusIndukan.dataValues.id_status_ternak,
                    status_keluar: null,
                    tanggal_keluar: null
                }
            });

            // Get data pejantan
            const pejantan = await this.db.Ternak.findAll({
                attributes: ['id_ternak','qr_id'],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    jenis_kelamin: 'jantan',
                    id_status_ternak: statusPejantan.dataValues.id_status_ternak,
                    status_keluar: null,
                    tanggal_keluar: null
                }
            });

            // Get fase perkawinan
            const fasePerkawinan = await this.db.Fase.findOne({where: {fase: 'Perkawinan'}});
            if(!fasePerkawinan) newError(404, 'Data Fase Perkawinan tidak ditemukan', 'getDataFormInput Service');

            // Get Pejantan in perkawinan
            const pejantanInPerkawinan = await this.db.Ternak.findAll({
                attributes: ['id_ternak','qr_id'],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    jenis_kelamin: 'jantan',
                    id_status_ternak: statusPejantan.dataValues.id_status_ternak,
                    id_fp: fasePerkawinan.dataValues.id_fp,
                    status_keluar: null,
                    tanggal_keluar: null
                },
                include: [
                    {
                        model: this.db.Kandang,
                        as: 'kandang',
                        attributes: ['kode_kandang']
                    }
                ]
            });
            for(let i = 0; i < pejantanInPerkawinan.length; i++){
                pejantanInPerkawinan[i].dataValues.text = pejantanInPerkawinan[i].dataValues.kandang ? `${pejantanInPerkawinan[i].dataValues.id_ternak} - ${pejantanInPerkawinan[i].dataValues.kandang.kode_kandang}` : `${pejantanInPerkawinan[i].dataValues.id_ternak} - null`
                delete pejantanInPerkawinan[i].dataValues.kandang;
            }

            // Get ternak jantan
            const ternakJantan = await this.db.Ternak.findAll({
                attributes: ['id_ternak','qr_id'],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    jenis_kelamin: 'Jantan',
                    status_keluar: null,
                    tanggal_keluar: null
                }
            });

            // Get ternak betina
            const ternakBetina = await this.db.Ternak.findAll({
                attributes: ['id_ternak','qr_id'],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    jenis_kelamin: 'Betina',
                    status_keluar: null,
                    tanggal_keluar: null
                }
            });

            // Get fase kelahiran
            const faseKelahiran = await this.db.Fase.findOne({where: {fase: 'Kelahiran'}})
            if(!faseKelahiran) newError(404, 'Data fase kelahiran tidak ditemukan', 'getDataFormInput Service')

            // Get ternak fase kelahiran
            const ternakKelahiran = await this.db.Ternak.findAll({
                attributes: ['id_ternak', 'qr_id'],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_fp: faseKelahiran.dataValues.id_fp,
                    status_keluar: null,
                    tanggal_keluar: null
                }
            })

            // Get fase kebuntingan
            const faseKebuntingan = await this.db.Fase.findOne({where: {fase: 'Kebuntingan'}})
            if(!faseKebuntingan) newError(404, 'Data fase kebuntingan tidak ditemukan', 'getDataFormInput Service')

            // Get fase laktasi
            const faseLaktasi = await this.db.Fase.findOne({where: {fase: 'Laktasi'}})
            if(!faseLaktasi) newError(404, 'Data fase laktasi tidak ditemukan', 'getDataFormInput Service')

            // Get indukan in faSE kebuntingan and laktasi
            const damKelahiran = await this.db.Ternak.findAll({
                attributes: ['id_ternak', 'qr_id'],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    jenis_kelamin: 'Betina',
                    id_fp: {
                        [Op.or]: [faseKebuntingan.dataValues.id_fp, faseLaktasi.dataValues.id_fp]
                    },
                    id_status_ternak: statusIndukan.dataValues.id_status_ternak,
                    status_keluar: null,
                    tanggal_keluar: null
                }
            })

            // Get ternak
            const ternak = await this.db.Ternak.findAll({
                attributes: ['id_ternak', 'qr_id'],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    status_keluar: null,
                    tanggal_keluar: null
                }
            })

            // Get fase
            const fase = await this.db.Fase.findAll({
                attributes: ['id_fp', 'fase']
            })
            for(let i = 0; i < fase.length; i++){
                if(fase[i].dataValues.fase.toLowerCase() === "adaptasi 1"){
                    fase[i].dataValues.fase = "Adaptasi"
                }else if(fase[i].dataValues.fase.toLowerCase() !== "adaptasi 1" && fase[i].dataValues.fase.toLowerCase().startsWith("adaptasi")){
                    fase.splice(i, 1)
                    i--
                }
            }
                
            return {
                code: 200,
                data: {
                    status_ternak: statusTernak,
                    kode_kandang: kodeKandang,
                    jenis_pakan: jenisPakan,
                    penyakit: penyakit,
                    jenis_kandang: jenisKandang,
                    bangsa: bangsa,
                    indukan: indukan,
                    pejantan: pejantan,
                    pejantan_perkawinan: pejantanInPerkawinan,
                    ternak_jantan: ternakJantan,
                    ternak_betina: ternakBetina,
                    cempe_kelahiran: ternakKelahiran,
                    dam_kelahiran: damKelahiran,
                    ternak: ternak,
                    fase: fase
                }
            }

        }catch (error){
            return errorHandler(error);
        }
    }
}

module.exports = (db) => new _formInput(db);