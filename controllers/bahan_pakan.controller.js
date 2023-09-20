const { Router } = require('express');
const bahanPakanService = require('../services/bahan_pakan.service');
const response = require('../utils/response');
const authentication = require('../middlewares/authentication');
const { adminMiddleware } = require('../middlewares/authorization');

const bahanPakanController = (db) => {
    const s$bahanPakan = bahanPakanService(db);
    const BahanPakanController = Router();


    /**
     * Get Jenis Bahan Pakan
     */
    BahanPakanController.get('/all', authentication, adminMiddleware, async (req, res) => {
        const data = await s$bahanPakan.getAllBahanPakan(req);
        return response.sendResponse(res, data);
    });


    /**
     * Get Jenis Bahan Pakan
     */
    BahanPakanController.get('/jenis', authentication, adminMiddleware, async (req, res) => {
        const data = await s$bahanPakan.getJenisBahanPakan(req);
        return response.sendResponse(res, data);
    });

    /**
     * create Jenis Bahan Pakan
     * @param {string} jenis_bahan_pakan
     * @param {string} satuan
     */
    BahanPakanController.post('/jenis', authentication, adminMiddleware, async (req, res) => {
        const data = await s$bahanPakan.createJenisBahanPakan(req);
        return response.sendResponse(res, data);
    });

    /**
     * Update Jenis Bahan Pakan
     * @param {number} id_jenis_bahan_pakan
     * @param {string} jenis_bahan_pakan
     * @param {string} satuan
     */
    BahanPakanController.put('/jenis', authentication, adminMiddleware, async (req, res) => {
        const data = await s$bahanPakan.updateJenisBahanPakan(req);
        return response.sendResponse(res, data);
    });

    /**
     * Delete Jenis Bahan Pakan
     * @param {number} id_jenis_bahan_pakan
     */
    BahanPakanController.delete('/jenis', authentication, adminMiddleware, async (req, res) => {
        const data = await s$bahanPakan.deleteJenisBahanPakan(req);
        return response.sendResponse(res, data);
    });

    /**
     * Get Data Bahan Pakan
     */
    BahanPakanController.get('/', authentication, adminMiddleware, async (req, res, next) => {
        const detail = await s$bahanPakan.getBahanPakan(req);
        response.sendResponse(res, detail);
    });

    /**
     * Create Data Bahan Pakan
     * @param {number} id_jenis_bahan_pakan
     * @param {string} tanggal
     * @param {number} jumlah
     * @param {string} keterangan
     */
    BahanPakanController.post('/', authentication, adminMiddleware, async (req, res, next) => {
        const detail = await s$bahanPakan.createBahanPakan(req);    
        response.sendResponse(res, detail);
    });

    return BahanPakanController;
}

module.exports = bahanPakanController;