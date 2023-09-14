const { Router } = require('express');
const LKPemasukanService = require('../services/lk_pemasukan.service');
const response = require('../utils/response');
const authentication = require('../middlewares/authentication');
const { adminMiddleware } = require('../middlewares/authorization');

const lkPemasukanController = (db) => {
    const s$lkPemasukan = LKPemasukanService(db);
    const LKPemasukanController = Router();

    /**
     * Get Data Ternak Masuk
     */
    LKPemasukanController.get('/ternak-baru', authentication, adminMiddleware, async (req, res) => {
        const result = await s$lkPemasukan.getTernakMasuk(req);
        response.sendResponse(res, result);
    });


    /**
     * Get LK Pemasukan
     */
    LKPemasukanController.get('/', authentication, adminMiddleware, async (req, res, next) => {
        const detail = await s$lkPemasukan.getLKPemasukan(req);
        response.sendResponse(res, detail);
    });

    /**
     * Create LK Pemasukan
     * @param {number} id_ternak
     * @param {string} qr_id
     * @param {number} id_bangsa
     * @param {string} jenis_kelamin
     * @param {number} cek_poel
     * @param {string} cek_mulut
     * @param {string} cek_telinga
     * @param {string} cek_kuku_kaki
     * @param {string} cek_kondisi_fisik_lain
     * @param {string} cek_bcs
     * @param {number} id_kandang
     */
    LKPemasukanController.post('/', authentication, adminMiddleware, async (req, res, next) => {
        const result = await s$lkPemasukan.createLKPemasukan(req);
        response.sendResponse(res, result);
    });

    /**
     * Get LK Pemasukan this month
     */
    LKPemasukanController.get('/this-month', authentication, adminMiddleware, async (req, res, next) => {
        const result = await s$lkPemasukan.getLKPemasukanThisMonth(req);
        response.sendResponse(res, result);
    });

    return LKPemasukanController;
}

module.exports = lkPemasukanController;