const { Router } = require('express');
const rfidAuth = require('../middlewares/rfid_auth');
const rfidService = require('../services/rfid.service');
const response = require('../utils/response');

const rfidController = (db) => {
    const s$rfid = rfidService(db);
    const RfidController = Router();

    /**
     * Add Ternak
     * @param {string} qr_id
     * @param {number} id_peternakan
     * @param {string} jenis_ternak_baru
    */
    RfidController.post('/add-data', rfidAuth, async (req, res, next) => {
        const detail = await s$rfid.rfid(req);
        response.sendResponse(res, detail);
    } );

    /**
     * Get Data Ternak
    */
    RfidController.post('/get-data', async (req, res, next) => {
        const detail = await s$rfid.rfidGetTernak(req);
        response.sendResponse(res, detail);
    } );

    return RfidController;
}

module.exports = rfidController;