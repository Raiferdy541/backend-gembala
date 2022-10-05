const { Router } = require('express');
const s$kandang = require('../services/kandang.service');
const response = require('../utils/response');
const authentication = require('../middlewares/authentication');
const {employeeAuth} = require('../middlewares/authorization');

const KandangController = Router();

/**
 * Get List Kandang (use query)
*/

KandangController.get('/', authentication, async (req, res, next) => {
    const detail = await s$kandang.getKandang(req);
    response.sendResponse(res, detail);
} );

/**
 * Create Kandang
 * @param {string} kode_kandang
 * @param {string} jenis_kandang
 */

KandangController.post('/', authentication, employeeAuth, async (req, res, next) => {
    const add = await s$kandang.createKandang(req);
    response.sendResponse(res, add);
});

/**
 * Update Kandang
 * @param {number} id_kandang
 * @param {string} kode_kandang
 * @param {string} jenis_kandang
*/

KandangController.put('/', authentication, employeeAuth, async (req, res, next) => {
    const edit = await s$kandang.updateKandang(req);
    response.sendResponse(res, edit);
});

/**
 * Delete Kandang
 * @param {number} id_kandang
*/

KandangController.delete('/', authentication, employeeAuth, async (req, res, next) => {
    const del = await s$kandang.deleteKandang(req);
    response.sendResponse(res, del);
});

module.exports = KandangController;