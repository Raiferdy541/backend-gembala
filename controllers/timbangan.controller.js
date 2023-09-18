const { Router } = require('express');
const timbanganService = require('../services/timbangan.service');
const response = require('../utils/response');
const authentication = require('../middlewares/authentication');
const { adminMiddleware } = require('../middlewares/authorization');

const timbanganController = (db) => {
    const s$timbangan = timbanganService(db);
    const TimbanganController = Router();

    /**
     * Get data timbangan
    */
    TimbanganController.get('/', authentication, adminMiddleware, async (req, res, next) => {
        const detail = await s$timbangan.getDataTimbangan(req);
        response.sendResponse(res, detail);
    } );

    /**
     * Create new data timbangan
     * @param {number} id_ternak
     * @param {string} qr_id
     * @param {number} berat_berkala
     * @param {number} suhu_berkala
     * @param {string} tanggal
     */
    TimbanganController.post('/',  async (req, res, next) => {
        const add = await s$timbangan.createDataTimbangan(req);
        response.sendResponse(res, add);
    });

    /**
     * Update data timbangan
     * @param {number} id_timbangan
     * @param {number} id_ternak
     * @param {string} qr_id
     * @param {number} berat_berkala
     * @param {number} suhu_berkala
     * @param {string} tanggal
    */
    TimbanganController.put('/', authentication, adminMiddleware, async (req, res, next) => {
        const edit = await s$timbangan.updateDataTimbangan(req);
        response.sendResponse(res, edit);
    });

    /**
     * Delete data timbangan
     * @param {number} id_timbangan
    */
    TimbanganController.delete('/', authentication, adminMiddleware, async (req, res, next) => {
        const del = await s$timbangan.deleteDataTimbangan(req);
        response.sendResponse(res, del);
    });

    return TimbanganController;
}

module.exports = timbanganController;