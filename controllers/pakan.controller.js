const { Router } = require('express');
const pakanService = require('../services/pakan.service');
const response = require('../utils/response');
const authentication = require('../middlewares/authentication');
const { adminMiddleware } = require('../middlewares/authorization');

const pakanController = (db) => {
    const s$pakan = pakanService(db);
    const PakanController = Router();

    /**
     * Get Jenis Pakan
     */
    PakanController.get('/jenis', authentication, adminMiddleware, async (req, res) => {
        const data = await s$pakan.getJenisPakan(req);
        return response.sendResponse(res, data);
    });

    // test ---------
    PakanController.get('/pakan-ternak', authentication, adminMiddleware, async (req, res) => {
        const data = await s$pakan.getPakanTernak(req);
        return response.sendResponse(res, data);
    });

    PakanController.get('/bahan-pakan-ternak', authentication, adminMiddleware, async (req, res) => {
        const data = await s$pakan.getBahanPakanTernak(req);
        return response.sendResponse(res, data);
    });

    PakanController.get('/jenis-bahan-pakan-ternak', authentication, adminMiddleware, async (req, res) => {
        const data = await s$pakan.getJenisBahanPakanTernak(req);
        return response.sendResponse(res, data);
    });

    PakanController.post('/jenis-bahan-pakan-ternak', authentication, adminMiddleware, async (req, res) => {
        const data = await s$pakan.createJenisBahanPakanTernak(req);
        return response.sendResponse(res, data);
    });

    PakanController.post('/bahan-pakan-ternak', authentication, adminMiddleware, async (req, res) => {
        const data = await s$pakan.createBahanPakanTernak(req);
        return response.sendResponse(res, data);
    });

    //-------------

    /**
     * Create Jenis Pakan
     * @param {string} jenis_pakan
     * @param {number} interval_pakan
     * @param {string} satuan
     * @param {string} komposisi
     * @param {string} nutrien
     */
    PakanController.post('/jenis', authentication, adminMiddleware, async (req, res) => {
        const data = await s$pakan.createJenisPakan(req);
        return response.sendResponse(res, data);
    });

    /**
     * Update Jenis Pakan
     * @param {number} id_jenis_pakan
     * @param {string} jenis_pakan
     * @param {number} interval_pakan
     * @param {string} satuan
     * @param {string} komposisi
     * @param {string} nutrien
     */
    PakanController.put('/jenis', authentication, adminMiddleware, async (req, res) => {
        const data = await s$pakan.updateJenisPakan(req);
        return response.sendResponse(res, data);
    });

    /**
     * Delete Jenis Pakan
     * @param {number} id_jenis_pakan
     */
    PakanController.delete('/jenis', authentication, adminMiddleware, async (req, res) => {
        const data = await s$pakan.deleteJenisPakan(req);
        return response.sendResponse(res, data);
    });

    /**
     * Get Data Pakan
    */
    PakanController.get('/', authentication, adminMiddleware, async (req, res, next) => {
        const detail = await s$pakan.getPakan(req);
        response.sendResponse(res, detail);
    } );

    /**
     * Create Pakan
     * @param {number} id_jenis_pakan
     * @param {number} id
     */
    PakanController.post('/', authentication, adminMiddleware, async (req, res, next) => {
        const add = await s$pakan.createPakan(req);
        response.sendResponse(res, add);
    });

    /**
     * Update Pakan
     * @param {number} id_pakan
     * @param {number} id_jenis_pakan
     * @param {number} id
    */
    PakanController.put('/', authentication, adminMiddleware, async (req, res, next) => {
        const edit = await s$pakan.updatePakan(req);
        response.sendResponse(res, edit);
    });

    /**
     * Delete Pakan
     * @param {number} id_pakan
    */
    PakanController.delete('/', authentication, adminMiddleware, async (req, res, next) => {
        const del = await s$pakan.deletePakan(req);
        response.sendResponse(res, del);
    });

    /**
     * Fill Pakan
     * @param {number} id_pakan
     * @param {string} tanggal_pembuatan
     * @param {string} tanggal_konsumsi
     */
    PakanController.post('/fill', authentication, adminMiddleware, async (req, res, next) => {
        const fill = await s$pakan.fillPakan(req);
        response.sendResponse(res, fill);
    });

    /**
     * Update fill pakan
     * @param {number} id_pakan
     * @param {string} tanggal_pembuatan
     * @param {string} tanggal_konsumsi
     */
    PakanController.put('/fill', authentication, adminMiddleware, async (req, res, next) => {
        const fill = await s$pakan.updateFillPakan(req);
        response.sendResponse(res, fill);
    });

    /**
     * Empty Pakan
     * @param {number} id_pakan
     */
    PakanController.post('/empty', authentication, adminMiddleware, async (req, res, next) => {
        const empty = await s$pakan.emptyPakan(req);
        response.sendResponse(res, empty);
    });

    return PakanController;
}

module.exports = pakanController;