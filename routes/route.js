const superAdminController = require("../controllers/superadmin.controller");
const authController = require("../controllers/auth.controller");
const kandangController = require("../controllers/kandang.controller");
const pakanController = require("../controllers/pakan.controller");
const bahanPakanController = require("../controllers/bahan_pakan.controller");
const faseController = require("../controllers/fase.controller");
const penyakitController = require("../controllers/penyakit.controller");
const bangsaController = require("../controllers/bangsa.controller");
const perkawinanController = require("../controllers/perkawinan.controller");
const timbanganController = require("../controllers/timbangan.controller");
const ternakController = require("../controllers/ternak.controller");
const riwayatKesehatanController = require("../controllers/riwayat_kesehatan.controller");
const rfidController = require("../controllers/rfid.controller");
const webDashController = require("../controllers/web_dash.controller");
const lkPemasukanController = require("../controllers/lk_pemasukan.controller");
const mobileDashController = require("../controllers/mobile_dash.controller");
const statusController = require("../controllers/status.controller");
const jenisKandangController = require("../controllers/jenis_kandang.controller");
const pemeliharaanController = require("../controllers/pemeliharaan.controller");
const adaptasiController = require("../controllers/adaptasi.controller");
const formInputController = require("../controllers/form_input.controller")
const loggingController = require("../controllers/logging.controller");
const kebuntinganController = require("../controllers/kebuntingan.controller");
const riwayatPerkawinanController = require("../controllers/riwayat_perkawinan.controller");
const riwayatKebuntinganController = require("../controllers/riwayat_kebuntingan.controller");
const kesehatanController = require('../controllers/kesehatan.controller');
const kelahiranController = require("../controllers/kelahiran.controller");
const riwayatKelahiranController = require("../controllers/riwayat_kelahiran.controller");
const lepasSapihController = require("../controllers/lepas_sapih.controller");
const riwayatLepasSapihController = require("../controllers/riwayat_lepas_sapih.controller");
//
const fattening_dController = require("../controllers/fattening_d.controller");
// const bukuPakan_dController = require("../controllers/buku_pakan.controller");


// Define url API in here
const _routes = [
    ['/auth', authController],
    ['/superadmin', superAdminController],
    ['/kandang', kandangController],
    ['/pakan', pakanController],
    ['/bahan-pakan', bahanPakanController],
    ['/fase', faseController],
    ['/penyakit', penyakitController],
    ['/bangsa', bangsaController],
    ['/perkawinan', perkawinanController],
    ['/timbangan', timbanganController],
    ['/ternak', ternakController],
    ['/riwayat-kesehatan', riwayatKesehatanController],
    ['/rfid', rfidController],
    ['/web-dash', webDashController],
    ['/lk-pemasukan', lkPemasukanController],
    ['/mobile-dash', mobileDashController],
    ['/status-ternak', statusController],
    ['/jenis-kandang', jenisKandangController],
    ['/pemeliharaan', pemeliharaanController],
    ['/adaptasi', adaptasiController],
    ['/form-input', formInputController],
    ['/logging', loggingController],
    ['/kebuntingan', kebuntinganController],
    ['/riwayat-perkawinan', riwayatPerkawinanController],
    ['/riwayat-kebuntingan', riwayatKebuntinganController],
    ['/kesehatan', kesehatanController],
    ['/kelahiran', kelahiranController],
    ['/riwayat-kelahiran', riwayatKelahiranController],
    ['/lepas-sapih', lepasSapihController],
    ['/riwayat-lepas-sapih', riwayatLepasSapihController],

    ['/fattening', fattening_dController],
    // ['/buku-pakan', bukuPakan_dController],
];

const routes = (app, db) => {
    // Routing
    _routes.forEach((route) => {
        const [url, controller] = route;
        app.use(`/api${url}`, controller(db));
    })
}

module.exports = routes;