const { newError, errorHandler } = require('../utils/errorHandler');
const DateExtension = require('@joi/date')
const Joi = require('joi');
const joi = Joi.extend(DateExtension);

class _kelahiran {
    constructor(db) {
        this.db = db;
    }
    // Get new ternak kelahiran
    getNewTernakKelahiran = async (req) => {
        try {
            // Get data status ternak
            const statusTernak = await this.db.StatusTernak.findOne({where: {status_ternak: "Cempe"}});
            if (!statusTernak) newError(404, 'Data Status Ternak Cempe tidak ditemukan', 'getNewTernakKelahiran Service');
            
            // Add params
            req.query.id_peternakan = req.dataAuth.id_peternakan
            req.query.id_fp = null
            req.query.id_dam = null
            req.query.id_status_ternak = statusTernak.dataValues.id_status_ternak
            req.query.status_keluar = null
            req.query.tanggal_keluar = null
            // Get data new ternak kelahiran
            const list = await this.db.Ternak.findAll({attributes: ['id_ternak', 'qr_id'], where: req.query});
            if (list.length <= 0) newError(404, 'Data New Ternak Kelahiran tidak ditemukan', 'getNewTernakKelahiran Service');

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

    // Get data kelahiran
    getKelahiran = async (req) => {
        try {
            // Get data fase kelahiran
            const faseKelahiran = await this.db.Fase.findOne({where: {fase: "Kelahiran"}});
            if (!faseKelahiran) newError(404, 'Data Fase Kelahiran tidak ditemukan', 'getKelahiran Service');

            // Get data kelahiran
            const list = await this.db.Ternak.findAll({
                attributes: ['id_ternak', 'jenis_kelamin', 'tanggal_lahir'],
                include: [
                    {
                        model: this.db.Bangsa,
                        as: 'bangsa',
                        attributes: ['id_bangsa', 'bangsa']
                    },
                    {
                        model: this.db.Kandang,
                        as: 'kandang',
                        attributes: ['id_kandang', 'kode_kandang']
                    },
                    {
                        model: this.db.Timbangan,
                        as: 'timbangan',
                        attributes: ['berat', 'suhu', 'tanggal_timbang']
                    }
                ],
                where: {
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_fp: faseKelahiran.dataValues.id_fp
                }
            });
            for(let i=0; i<list.length; i++){
                // Get Umur
                const umurHari = list[i].dataValues.tanggal_lahir ? Math.round((new Date() - new Date(list[i].dataValues.tanggal_lahir)) / (1000 * 60 * 60 * 24)) : 0;
                list[i].dataValues.umur = `${Math.floor(umurHari / 30)} bulan ${umurHari % 30} hari`;

                // Get Berat & Suhu
                list[i].dataValues.berat = list[i].dataValues.timbangan.length > 0 ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].berat : 0;
                list[i].dataValues.suhu = list[i].dataValues.timbangan.length > 0 ? list[i].dataValues.timbangan[list[i].dataValues.timbangan.length - 1].suhu : 0;

                delete list[i].dataValues.timbangan;
            }
            if (list.length <= 0) newError(404, 'Data Kelahiran tidak ditemukan', 'getKelahiran Service');
            const total = list.length;
            const totalCempeJantan = list.filter(item => item.dataValues.jenis_kelamin.toLowerCase() == 'jantan').length;
            const totalCempeBetina = list.filter(item => item.dataValues.jenis_kelamin.toLowerCase() == 'betina').length;

            let totalByKandang = {};
            list.forEach(item => {
                if (totalByKandang[item.dataValues.kandang.kode_kandang]) {
                    totalByKandang[item.dataValues.kandang.kode_kandang] += 1;
                } else {
                    totalByKandang[item.dataValues.kandang.kode_kandang] = 1;
                }
            });

            return {
                code: 200,
                data: {
                    kandang: {
                        total: Object.keys(totalByKandang).length,
                        list: totalByKandang
                    },
                    ternak:{
                        total,
                        total_cempe_jantan: totalCempeJantan,
                        total_cempe_betina: totalCempeBetina,
                        list
                    }
                },
            };
        } catch (error) {
            return errorHandler(error);
        }
    }
            
    // Create kelahiran
    createKelahiran = async (req) => {
        const t = await this.db.sequelize.transaction();
        try {
            // Validate data
            const schema = joi.object({
                id_ternak: joi.number().required(),
                tanggal_masuk: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
                tanggal_lahir: joi.date().format(['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'DD-MM-YYYYTHH:mm:ss.SSSZ']).allow(null),
                id_sire: joi.number().allow(null),
                id_dam: joi.number().required(),
                jenis_kelamin: joi.string().required(),
                id_bangsa: joi.number().required(),
                id_kandang: joi.number().required(),
            });
            const { error, value } = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'createKelahiran Service');

            // Check sire & dam
            if (value.id_sire && value.id_sire == value.id_dam) newError(400, 'Sire & Dam tidak boleh sama', 'createKelahiran Service');

            // Check sire
            if (value.id_sire) {
                const sire = await this.db.Ternak.findOne({
                    attributes: ['id_ternak', 'jenis_kelamin'],
                    where: {
                        id_ternak: value.id_sire,
                        id_peternakan: req.dataAuth.id_peternakan
                    }
                });
                if (!sire) newError(404, 'Data Sire tidak ditemukan', 'createKelahiran Service');
                if (sire.dataValues.jenis_kelamin.toLowerCase() != 'jantan') newError(400, 'Sire harus Jantan', 'createKelahiran Service');
            }

            // Check dam
            const dam = await this.db.Ternak.findOne({
                attributes: ['id_ternak', 'jenis_kelamin'],
                where: {
                    id_ternak: value.id_dam,
                    id_peternakan: req.dataAuth.id_peternakan
                }
            });
            if (!dam) newError(404, 'Data Dam tidak ditemukan', 'createKelahiran Service');
            if (dam.dataValues.jenis_kelamin.toLowerCase() != 'betina') newError(400, 'Dam harus Betina', 'createKelahiran Service');

            // Get data bangsa
            const bangsa = await this.db.Bangsa.findOne({ where: { id_bangsa: value.id_bangsa } });
            if (!bangsa) newError(404, 'Data Bangsa tidak ditemukan', 'createKelahiran Service');

            // Get data kandang
            const kandang = await this.db.Kandang.findOne({ where: { id_kandang: value.id_kandang } });
            if (!kandang) newError(404, 'Data Kandang tidak ditemukan', 'createKelahiran Service');

            // Get data fase kelahiran
            const faseKelahiran = await this.db.Fase.findOne({ where: { fase: "Kelahiran" } });
            if (!faseKelahiran) newError(404, 'Data Fase Kelahiran tidak ditemukan', 'createKelahiran Service');

            // Check ternak
            const checkTernak = await this.db.Ternak.findOne({where: {id_ternak: value.id_ternak, id_peternakan: req.dataAuth.id_peternakan}});
            if (!checkTernak) newError(404, 'Data Ternak tidak ditemukan', 'createKelahiran Service');
            if (checkTernak.dataValues.id_fp === faseKelahiran.dataValues.id_fp) newError(400, 'Ternak already in Kelahiran', 'createKelahiran Service');

            // Update ternak
            const ternak = await this.db.Ternak.update({
                tanggal_masuk: value.tanggal_masuk || new Date(),
                tanggal_lahir: value.tanggal_lahir || new Date(),
                id_sire: value.id_sire || null,
                id_dam: value.id_dam,
                jenis_kelamin: value.jenis_kelamin,
                id_bangsa: value.id_bangsa,
                id_kandang: value.id_kandang,
                id_fp: faseKelahiran.dataValues.id_fp,
            }, { 
                where: { 
                    id_ternak: value.id_ternak,
                    id_peternakan: req.dataAuth.id_peternakan,
                },
                transaction: t,
            });
            if (ternak[0] <= 0) newError(500, 'Gagal update data Ternak', 'createKelahiran Service');

            // Create data kelahiran
            const kelahiran = await this.db.RiwayatKelahiran.create({
                id_peternakan: req.dataAuth.id_peternakan,
                id_ternak: value.id_ternak,
                tanggal_masuk: value.tanggal_masuk || new Date(),
                tanggal_lahir: value.tanggal_lahir || new Date(),
                id_sire: value.id_sire || null,
                id_dam: value.id_dam,
                jenis_kelamin: value.jenis_kelamin,
                bangsa: bangsa.dataValues.bangsa,
                kode_kandang: kandang.dataValues.kode_kandang,
            }, { transaction: t });
            if (!kelahiran) newError(500, 'Gagal menambah riwayat kelahiran', 'createKelahiran Service');

            // Create riwayat fase
            const riwayatFase = await this.db.RiwayatFase.create({
                id_peternakan: req.dataAuth.id_peternakan,
                id_ternak: value.id_ternak,
                id_fp: faseKelahiran.dataValues.id_fp,
                tanggal: new Date(),
            }, { transaction: t });
            if (!riwayatFase) newError(500, 'Gagal menambah riwayat fase', 'createKelahiran Service');

            // Check fase indukan
            const indukan = await this.db.Ternak.findOne({
                attributes: ['id_ternak'],
                include: [
                    {
                        model: this.db.Fase,
                        as: 'fase',
                        attributes: ['fase'],
                    },
                    {
                        model: this.db.RiwayatKebuntingan,
                        as: 'riwayat_kebuntingan',
                        attributes: ['tanggal_kebuntingan'],
                        where: {
                            status: "Partus"
                        },
                        required: false
                    }
                ],
                where: {id_ternak: value.id_dam, id_peternakan: req.dataAuth.id_peternakan},
            });
            if (!indukan) newError(404, 'Data Indukan tidak ditemukan', 'createKelahiran Service');

            // If Indukan not in Laktasi fase, Move to Laktasi
            if (indukan.dataValues.fase.dataValues.fase.toLowerCase() !== 'laktasi') {
                // Get fase laktasi
                const faseLaktasi = await this.db.Fase.findOne({ where: { fase: 'Laktasi' } });
                if (!faseLaktasi) newError(404, 'Data Fase Laktasi tidak ditemukan', 'createKelahiran Service');
                
                // Update fase indukan
                const updateIndukan = await this.db.Ternak.update({
                    id_fp: faseLaktasi.dataValues.id_fp,
                }, {
                    where: {
                        id_ternak: value.id_dam,
                        id_peternakan: req.dataAuth.id_peternakan,
                    },
                    transaction: t,
                });
                if (updateIndukan[0] <= 0) newError(500, 'Gagal mengupdate fase Indukan', 'createKelahiran Service');

                // Create riwayat fase indukan
                const riwayatFaseIndukan = await this.db.RiwayatFase.create({
                    id_peternakan: req.dataAuth.id_peternakan,
                    id_ternak: value.id_dam,
                    id_fp: faseLaktasi.dataValues.id_fp,
                    tanggal: new Date(),
                }, { transaction: t });
                if (!riwayatFaseIndukan) newError(500, 'Gagal menambah riwayat fase Indukan', 'createKelahiran Service');
            }

            // If Indukan Bunting 4x, Set status to Afkir
            if(indukan.dataValues.riwayat_kebuntingan.length >= 3) {
                // Get status afkir
                const statusAfkir = await this.db.StatusTernak.findOne({ where: { status_ternak: 'Afkir' } });
                if (!statusAfkir) newError(404, 'Data Status Afkir tidak ditemukan', 'createKelahiran Service');

                // Update status ternak
                const updateStatus = await this.db.Ternak.update({
                    id_status_ternak: statusAfkir.dataValues.id_status_ternak,
                }, {
                    where: {
                        id_ternak: value.id_dam,
                        id_peternakan: req.dataAuth.id_peternakan,
                    },
                    transaction: t,
                });
                if (updateStatus[0] <= 0) newError(500, 'Gagal mengubah data status ternak', 'createKelahiran Service');
            }

            // Create riwayat kebuntingan
            if(indukan.dataValues.fase.dataValues.fase.toLowerCase() === 'kebuntingan') {
                // Get riwayat perkawinan indukan
                const latestRiwayatPerkawinan = await this.db.RiwayatPerkawinan.findAll({
                    attributes: ['id_riwayat_perkawinan', 'tanggal_perkawinan', 'id_pejantan'],
                    where: {id_indukan: indukan.dataValues.id_ternak, id_peternakan: req.dataAuth.id_peternakan},
                    order: [['createdAt', 'DESC']],
                    limit: 1
                });
                if(latestRiwayatPerkawinan.length <= 0) newError(404, 'Data Riwayat Perkawinan tidak ditemukan', 'createKelahiran Service');

                // Get fase kebuntingan
                const faseKebuntingan = await this.db.Fase.findOne({ where: { fase: 'Kebuntingan' } });
                if (!faseKebuntingan) newError(404, 'Data Fase Kebuntingan tidak ditemukan', 'createKelahiran Service');

                // Get riwayat fase kebuntingan indukan
                const latestRiwayatFaseKebuntingan = await this.db.RiwayatFase.findAll({
                    attributes: ['id_riwayat_fase', 'tanggal'],
                    where: {id_ternak: indukan.dataValues.id_ternak, id_fp: faseKebuntingan.dataValues.id_fp, id_peternakan: req.dataAuth.id_peternakan},
                    order: [['createdAt', 'DESC']],
                    limit: 1
                });
                if(latestRiwayatFaseKebuntingan.length <= 0) newError(404, 'Data Riwayat Fase Kebuntingan tidak ditemukan', 'createKelahiran Service');
                
                // Create riwayat kebuntingan indukan
                const historyKebuntingan = await this.db.RiwayatKebuntingan.create({
                    id_riwayat_perkawinan: latestRiwayatPerkawinan[0].dataValues.id_riwayat_perkawinan,
                    id_indukan: indukan.dataValues.id_ternak,
                    id_pejantan: latestRiwayatPerkawinan[0].dataValues.id_pejantan,
                    id_peternakan: req.dataAuth.id_peternakan,
                    status: 'Partus',
                    tanggal_perkawinan: latestRiwayatPerkawinan[0].dataValues.tanggal_perkawinan,
                    tanggal_kebuntingan: latestRiwayatFaseKebuntingan[0].dataValues.tanggal
                },{transaction: t});
                if(!historyKebuntingan) newError(500, 'Gagal mengubah riwayat kebuntingan', 'createKelahiran Service');
            }

            // Commit transaction
            await t.commit();

            return{
                code: 200,
                data: {
                    id_kelahiran: kelahiran.dataValues.id_kelahiran,
                    id_ternak: kelahiran.dataValues.id_ternak,
                    createdAt: kelahiran.dataValues.createdAt,
                }
            };
        } catch (error) {
            // Rollback transaction
            await t.rollback();
            return errorHandler(error);
        }
    }
}


module.exports = (db) => new _kelahiran(db);