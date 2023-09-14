const { Router } = require('express');
const ternakService = require('../services/ternak.service');
const response = require('../utils/response');
const authentication = require('../middlewares/authentication');
const { adminMiddleware } = require('../middlewares/authorization');

const ternakController = (db) => {
    const s$ternak = ternakService(db);
    // Router
    const TernakController = Router();

    /**
     * Get List Ternak
    */
    TernakController.get('/', authentication, adminMiddleware, async (req, res, next) => {
        const detail = await s$ternak.getTernak(req);
        response.sendResponse(res, detail);
    });

    /**
     * Get list ternak for mobile app
     */
    TernakController.get('/mobile', authentication, adminMiddleware, async (req, res, next) => {
        const detail = await s$ternak.getTernakMobile(req);
        response.sendResponse(res, detail);
    });

    /**
     * Get List Ternak
    */
    TernakController.get('/indukan', authentication, adminMiddleware, async (req, res, next) => {
        const detail = await s$ternak.getDataIndukan(req);
        response.sendResponse(res, detail);
    });

    /**
     * Get List Ternak
    */
    TernakController.get('/pejantan', authentication, adminMiddleware, async (req, res, next) => {
        const detail = await s$ternak.getDataPejantan(req);
        response.sendResponse(res, detail);
    });

    /**
     * Create new data ternak
     * @param {string} qr_id
     * @param {number} id_varietas
     * @param {number} id_induk
     * @param {number} id_pejantan
     * @param {number} fase_pemeliharaan
     * @param {number} id_pakan
     * @param {number} id_kandang
     * @param {string} foto
     * @param {string} jenis_kelamin
     * @param {number} berat
     * @param {number} suhu
     * @param {string} status_sehat
     * @param {string} tanggal_lahir
     * @param {string} tanggal_masuk
     * @param {string} tanggal_keluar
     * @param {number} status_keluar
     */
    TernakController.post('/', authentication, adminMiddleware, async (req, res, next) => {
        const add = await s$ternak.createTernak(req);
        response.sendResponse(res, add);
    });

    /**
     * Update data ternak
     * @param {number} id_ternak
     * @param {string} qr_id
     * @param {number} id_varietas
     * @param {number} id_induk
     * @param {number} id_pejantan
     * @param {number} fase_pemeliharaan
     * @param {number} id_pakan
     * @param {number} id_kandang
     * @param {string} foto
     * @param {string} jenis_kelamin
     * @param {number} berat
     * @param {number} suhu
     * @param {string} status_sehat
     * @param {string} tanggal_lahir
     * @param {string} tanggal_masuk
     * @param {string} tanggal_keluar
     * @param {number} status_keluar
     */
    TernakController.put('/', authentication, adminMiddleware, async (req, res, next) => {
        const edit = await s$ternak.updateTernak(req);
        response.sendResponse(res, edit);
    });

    /**
     * Delete data ternak
     * @param {number} id_ternak
    */
    TernakController.delete('/', authentication, adminMiddleware, async (req, res, next) => {
        const del = await s$ternak.deleteTernak(req);
        response.sendResponse(res, del);
    });

    /**
     * Ternak keluar
     * @param {number} id_ternak
     * @param {string} tanggal_keluar
     * @param {string} status_keluar
     */
    TernakController.put('/keluar', authentication, adminMiddleware, async (req, res, next) => {
        const edit = await s$ternak.ternakKeluar(req);
        response.sendResponse(res, edit);
    });

    /**
     * Get ternak keluar
     */
    TernakController.get('/keluar', authentication, adminMiddleware, async (req, res, next) => {
        const detail = await s$ternak.getTernakKeluar(req);
        response.sendResponse(res, detail);
    });

    return TernakController;
}

module.exports = ternakController;