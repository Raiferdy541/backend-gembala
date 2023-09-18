const joi = require('joi');
const {generateToken, comparePassword, hashPassword} = require('../utils/auth');
const date = require('date-and-time');
const config = require('../config/app.config');
const jwt = require('jsonwebtoken');
const {verifyNewAccount, verifyEmailForgotPassword, bodEmailRegister} = require('../utils/email_verify');
const randomstring = require("randomstring");
const {newError, errorHandler} = require('../utils/errorHandler');
const fs = require('fs');
const axios = require('axios');
const { Op } = require("sequelize");


class _auth{
    constructor(db){
        this.db = db;
    }
    /// Login Service
    login = async (data) => {
        try{
            // Validate data
            const schema = joi.object({
                email: joi.string().email().required(),
                kata_sandi: joi.string().required()
            });
            const {error, value} = schema.validate(data);
            if (error) newError(400, error.details[0].message, 'Login Service');

            // Check if user exist
            const checkUsername = await this.db.AuthUser.findOne({where : {email: value.email}});
            if (!checkUsername) newError(400, 'Email tidak terdaftar', 'Login Service');

            // Check status users
            if(checkUsername.status == 'inactive'){
                verifyNewAccount(checkUsername);
                newError(400, 'Akun anda belum aktif, silahkan cek email anda untuk aktivasi', 'Login Service');
            }

            // Compare password
            const isMatch = await comparePassword(value.kata_sandi, checkUsername.kata_sandi);
            if (!isMatch) newError(400, 'Password salah', 'Login Service');

            // Generate token
            const token = generateToken({ 
                id_user: checkUsername.id_user, 
                nama_pengguna: checkUsername.nama_pengguna, 
                role: checkUsername.role,
                status: checkUsername.status,
                id_peternakan: checkUsername.id_peternakan
            });
            if (!token) newError(400, 'Gagal generate token', 'Login Service');

            // Update lastAccess
            const updateLastAccess = await this.db.AuthUser.update({lastAccess: new Date()}, {where: {id_user: checkUsername.dataValues.id_user}});
            if (!updateLastAccess) newError(500, 'Gagal update last access', 'Login Service');

            return {
                code : 200,
                data: {
                    token,
                    expiresAt: date.format(date.addSeconds(new Date(), config.jwt.expiresIn), 'YYYY-MM-DD HH:mm:ss')
                },
            }
        }catch(err){
            return errorHandler(err);
        }
    }

    /// Register Service
    register = async (data) => {
        const t = await this.db.sequelize.transaction();
        try{
            // Validate data
            const schema = joi.object({
                nama_pengguna: joi.string().min(4).max(30).required(),
                email: joi.string().email().required(),
                nomor_telepon: joi.string().required(),
                alamat: joi.string().required(),
                postcode: joi.string().required(),
                nama_peternakan: joi.string().required(),
                kata_sandi: joi.string().min(8).required(),
                ulangi_kata_sandi: joi.ref('kata_sandi')
            });
            const {error, value} = schema.validate(data);
            if (error) newError(400, error.details[0].message, 'Register Service');

            // Check if user exist
            const checkUsername = await this.db.AuthUser.findOne({where : {nama_pengguna: value.nama_pengguna}});
            if (checkUsername) newError(400, 'Username sudah terdaftar', 'Register Service');

            // check nomor telepon
            const checkNomorTelepon = await this.db.AuthUser.findOne({where : {nomor_telepon: value.nomor_telepon}});
            if (checkNomorTelepon) newError(400, 'Nomor telepon sudah terdaftar', 'Register Service');

            // check if email exist
            const checkEmail = await this.db.AuthUser.findOne({where : {email: value.email}});
            if (checkEmail) newError(400, 'Email sudah terdaftar', 'Register Service');

            // Get longtitude, latitude and alamat_postcode external API --------##########

            // const geocode = await axios.get(config.geocode.base_url, {
            //     params: {
            //         auth: config.geocode.auth,
            //         locate: value.postcode,
            //         geoit: config.geocode.geoit,
            //         region: config.geocode.region
            //     },
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Accept-Encoding': 'application/json',
            //     }
            // })
            // if(geocode.data.error) newError(400, 'Gagal mendapatkan data geocode, silahkan periiksa kembali postcode anda', 'Register Service');

            // ----- add peternakan ORIGIN --------##########

            // const addPeternakan = await this.db.Peternakan.create({
            //     nama_peternakan: value.nama_peternakan,
            //     alamat: value.alamat,
            //     postcode: value.postcode,
            //     longitude: geocode.data.longt,
            //     latitude: geocode.data.latt,
            //     alamat_postcode: geocode.data.standard.city + ', ' + geocode.data.standard.statename + ', ' + geocode.data.standard.countryname + ', ' + geocode.data.standard.postal
            // }, {transaction: t});
            // if(!addPeternakan) newError(400, 'Gagal menambahkan peternakan', 'Register Service');

            // ----- ADD PETERNAKAN VALUE NOT GEO --------##########

            const addPeternakan = await this.db.Peternakan.create({
                nama_peternakan: value.nama_peternakan,
                alamat: value.alamat,
                postcode: value.postcode,
                longitude: value.longitude,
                latitude: value.latitude,
                alamat_postcode: value.alamat
            }, {transaction: t});
            if(!addPeternakan) newError(400, 'Gagal menambahkan peternakan', 'Register Service');



            // -----\\\-------

            // Hash password
            value.kata_sandi = await hashPassword(value.kata_sandi);
            
            // Insert data
            const register = await this.db.AuthUser.create({
                nama_pengguna: value.nama_pengguna,
                email: value.email,
                role: 'admin',
                status: 'inactive',
                id_peternakan: addPeternakan.id_peternakan,
                nomor_telepon: value.nomor_telepon,
                kata_sandi: value.kata_sandi
            }, {transaction: t});
            if (!register) newError(400, 'Gagal registrasi', 'Register Service');

            // Send email verification
            verifyNewAccount(register);

            // Commit transaction
            await t.commit();

            return {
                code: 200,
                data: {
                    message: 'Email has been sent'
                }
            };
        }catch (error){
            await t.rollback();
            return errorHandler(error);
        }
    }

    /// Logout Service
    logout = async (req, res) => {
        try{
            const update = await this.db.AuthUser.update({lastAccess: new Date()}, {where: {id_user: req.dataAuth.id_user}});
            if (update <= 0) newError(400, 'Gagal logout', 'Logout Service');
            return {
                code: 200,
                data: {
                    id_user: req.dataAuth.id_user,
                    nama_pengguna: req.dataAuth.nama_pengguna,
                    logoutAt: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
                }
            }
        }catch(err){
            return errorHandler(err);
        }
    }

    /// Get Profile Service
    getProfile = async (req) => {
        try{
            // Query Data
            const list = await this.db.AuthUser.findOne({ 
                attributes: ['id_user', 'image', 'nama_pengguna', 'email', 'nomor_telepon', 'role', 'status'],
                include: [
                    {
                        model: this.db.Peternakan,
                        as: 'peternakan',
                        attributes: ['id_peternakan', 'nama_peternakan', 'alamat', 'postcode', 'alamat_postcode', 'longitude', 'latitude']
                    }
                ],
                where : {
                    id_user: req.dataAuth.id_user
                }
             });
            if(!list) newError(400, 'Gagal mendapatkan data profile', 'Get Profile Service');

            list.dataValues.image = list.dataValues.image ? `${req.protocol}://${req.get('host')}/avatar/${list.image}` : null;

            // Return peternakan based on token for superadmin
            if(req.dataAuth.role === 'superadmin') {
                const peternakan = await this.db.Peternakan.findOne({
                    attributes: ['id_peternakan', 'nama_peternakan', 'alamat', 'postcode', 'alamat_postcode', 'longitude', 'latitude'],
                    where: {
                        id_peternakan: req.dataAuth.id_peternakan
                    }
                });
                if(!peternakan) newError(400, 'Gagal mendapatkan data peternakan', 'Get Profile Service');
                list.dataValues.peternakan = peternakan;
            }

            return {
                code: 200,
                data: list
            };
        }catch (error){
            return errorHandler(error);
        }
    }
    
    /// Delete Account Service
    deleteAccount = async (req) => {
        try{
            // Validate data
            const schema = joi.object({
                kata_sandi: joi.string().required()
            });
            const {error, value} = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'DeleteAccount Service');

            // Check if user exist
            const checkUser = await this.db.AuthUser.findOne({where : {id_user: req.dataAuth.id_user}});
            if (!checkUser) newError(400, 'User tidak ditemukan', 'DeleteAccount Service');

            // Compare password
            const isMatch = await comparePassword(value.kata_sandi, checkUser.kata_sandi);
            if (!isMatch) newError(400, 'Password salah', 'DeleteAccount Service');

            // Delete data
            const deletedAccount = await this.db.AuthUser.destroy({where: {id_user: req.dataAuth.id_user}});
            if (deletedAccount <= 0) newError(400, 'Gagal menghapus akun', 'DeleteAccount Service');

            return {
                code: 200,
                data: {
                    id_user: req.dataAuth.id_user,
                    nama_pengguna: req.dataAuth.nama_pengguna,
                    deletedAt: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
                }
            }
        }catch(err){
            return errorHandler(err);
        }
    }
    
    /// Update Account Service
    updateAccount = async (req) => {
        // Validate data
        const schema = joi.object({
            nama_pengguna: joi.string().min(4).max(30).required(),
            nomor_telepon: joi.string().required(),
            alamat: joi.string().required(),
            postcode: joi.string().required(),
            nama_peternakan: joi.string().required(),
        });
        const {error, value} = schema.validate(req.body);
        if (error) newError(400, error.details[0].message, 'UpdateAccount Service');
        
        // Check user account
        const checkUser = await this.db.AuthUser.findOne({where : {id_user: req.dataAuth.id_user}});
        if (!checkUser) newError(400, 'Pengguna tidak ditemukan', 'UpdateAccount Service');

        // Check peternakan
        const checkPeternakan = await this.db.Peternakan.findOne({where : {id_peternakan: checkUser.id_peternakan}});
        if (!checkPeternakan) newError(400, 'Peternakan tidak ditemukan', 'UpdateAccount Service');

        // Check nomor telepon
        const checkNomorTelepon = await this.db.AuthUser.findOne({where : {
            nomor_telepon: value.nomor_telepon,
            id_user: {
                [Op.ne]: req.dataAuth.id_user
            }
        }});
        if (checkNomorTelepon) newError(400, 'Nomor telepon sudah terdaftar', 'UpdateAccount Service');

        // check username
        const checkUsername = await this.db.AuthUser.findOne({where : {
            nama_pengguna: value.nama_pengguna,
            id_user: {
                [Op.ne]: req.dataAuth.id_user
            }
        }});
        if (checkUsername) newError(400, 'Nama Pengguna sudah terdaftar', 'UpdateAccount Service');
        // if postcode is changed
        let geocode;
        if(value.postcode && value.postcode !== checkPeternakan.dataValues.postcode){
            // Get longtitude, latitude and alamat_postcode external API
            geocode = await axios.get(config.geocode.base_url, {
                params: {
                    auth: config.geocode.auth,
                    locate: value.postcode,
                    geoit: config.geocode.geoit,
                    region: config.geocode.region
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'application/json',
                }
            })
            if(!geocode) newError(400, 'Gagal mendapatkan data geocode, silahkan cek kembali kode pos anda', 'UpdateAccount Service');
        }

        // Update data
        const updatedAccount = await this.db.AuthUser.update({
            nama_pengguna: value.nama_pengguna || checkUser.dataValues.nama_pengguna,
            nomor_telepon: value.nomor_telepon || checkUser.dataValues.nomor_telepon,
        }, {
            where: {id_user: req.dataAuth.id_user}
        });
        if (updatedAccount <= 0) newError(500, 'Gagal mengupdate data pengguna', 'UpdateAccount Service');
        
        // Update peternakan --------########## ORIGIN
        const updatedPeternakan = await this.db.Peternakan.update({
            nama_peternakan: value.nama_peternakan || checkPeternakan.dataValues.nama_peternakan,
            alamat: value.alamat || checkPeternakan.dataValues.alamat,
            postcode: value.postcode || checkPeternakan.dataValues.postcode,
            latitude: (value.postcode && value.postcode !== checkPeternakan.dataValues.postcode) ? geocode.data.latt : checkPeternakan.dataValues.latitude,
            longitude: (value.postcode && value.postcode !== checkPeternakan.dataValues.postcode) ? geocode.data.longt : checkPeternakan.dataValues.longitude,
            alamat_postcode: (value.postcode && value.postcode !== checkPeternakan.dataValues.postcode) ? geocode.data.standard.city + ', ' + geocode.data.standard.statename + ', ' + geocode.data.standard.countryname + ', ' + geocode.data.standard.postal : checkPeternakan.dataValues.alamat_postcode,
        }, {
            where: {id_peternakan: req.dataAuth.id_peternakan}
        });
        if (updatedPeternakan <= 0) newError(500, 'Gagal mengupdate data peternakan', 'UpdateAccount Service');

        return {
            code : 200,
            data : {
                id_user: req.dataAuth.id_user,
                nama_pengguna: value.nama_pengguna,
                updatedAt: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
            }
        }
    }

    /// Update PAssword Service 
    updatePassword = async (req) => {
        // Validate Data
        const schema = joi.object({
            kata_sandi: joi.string().required(),
            kata_sandi_baru: joi.string().required(),
            ulangi_kata_sandi_baru: joi.ref('kata_sandi_baru')
        });
        const {error, value} = schema.validate(req.body);
        if (error) newError(400, error.details[0].message, 'UpdatePassword Service');

        // Check if user exist
        const checkUser = await this.db.AuthUser.findOne({where : {id_user: req.dataAuth.id_user}});
        if (!checkUser) newError(400, 'Pengguna tidak ditemukan', 'UpdatePassword Service');

        // Compare password
        const isMatch = await comparePassword(value.kata_sandi, checkUser.kata_sandi);
        if (!isMatch) newError(400, 'Password salah', 'UpdatePassword Service');

        // Hash password
        const newPassword = await hashPassword(value.kata_sandi_baru);

        // Update data
        const updatedPassword = await this.db.AuthUser.update({kata_sandi: newPassword}, {where: {id_user: req.dataAuth.id_user}});
        if (updatedPassword <= 0) newError(500, 'Gagal mengupdate password', 'UpdatePassword Service');

        return {
            code : 200,
            data : {
                id_user: req.dataAuth.id_user,
                nama_pengguna: checkUser.nama_pengguna,
                updatedAt: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
            }
        }
    }  

    /// Verify token
    verify = async (req) => {
        try{
            const user = await this.db.AuthUser.findOne({
                attributes: ['id_user', 'image', 'nama_pengguna', 'email', 'nomor_telepon', 'role', 'status', 'lastAccess'],
                include: [{
                    model: this.db.Peternakan,
                    as: 'peternakan',
                    attributes: ['id_peternakan', 'nama_peternakan', 'alamat', 'postcode', 'alamat_postcode']
                }],
                where : {
                    id_user: req.dataAuth.id_user
                }
            });
            if (!user) newError(400, 'Pengguna tidak ditemukan', 'Verify Service');

            user.dataValues.image = user.dataValues.image ? `${req.protocol}://${req.get('host')}/avatar/${user.image}` : null;
            user.dataValues.iat = req.dataAuth.iat;
            user.dataValues.exp = req.dataAuth.exp;
            user.dataValues.time = new Date()
            return {
                code: 200,
                data: user
            };
        }catch (error){
            return errorHandler(error);
        }
    }

    /// verify Account
    verifyAccount = async (token) => {
        try{
            const decoded = jwt.verify(token, config.jwt.secret)
            
            if(decoded.message == 'verification'){
                const user = await this.db.AuthUser.findOne({where : {id_user: decoded.id_user}});
                if (!user) newError(400, 'Pengguna tidak ditemukan', 'VerifyAccount Service');
                if(user.dataValues.status == 'active') newError(400, 'Akun sudah aktif', 'VerifyAccount Service');

                const activateAccount = await this.db.AuthUser.update({status: 'active'}, {where: {id_user: decoded.id_user}});
                if (activateAccount <= 0) newError(500, 'Gagal memverifikasi akun', 'VerifyAccount Service');
            }else{
                newError(400, 'Token tidak valid', 'VerifyAccount Service');
            }

            // Generate token for peternakan
            const tokenPeternakan = jwt.sign({
                id_peternakan: decoded.id_peternakan
            }, config.jwt.secret);

            const createFarmToken = await this.db.Peternakan.update({
                token: tokenPeternakan
            }, {
                where: {id_peternakan: decoded.id_peternakan}
            });
            if (createFarmToken <= 0) newError(500, 'Gagal membuat token peternakan', 'VerifyAccount Service');

            return {
                code: 200,
                data: {
                    message: 'Account has been activated'
                }
            };
        }catch(error){
            return errorHandler(error);
        }
    }

    /// Forgot Password
    forgotPassword = async (req) => {
        try{
            // Validate data
            const schema = joi.object({
                email: joi.string().email().required(),
            });
            const {error, value} = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'ForgotPassword Service');
            // Check if user exist
            const checkUser = await this.db.AuthUser.findOne({where : {email: value.email}});
            if (!checkUser) newError(400, 'Penguna tidak ditemukan', 'ForgotPassword Service');

            // updatedTempPassword
            const tempPassword = randomstring.generate(8);
            const tempPasswordHash = await hashPassword(tempPassword);
            const updatedTempPassword = await this.db.AuthUser.update({kata_sandi: tempPasswordHash}, {where: {id_user: checkUser.id_user}});
            if (updatedTempPassword <= 0) newError(500, 'Gagal mengupdate password', 'ForgotPassword Service');

            verifyEmailForgotPassword(checkUser, tempPassword);

            return {   
                code: 200,
                data: {
                    message: 'Email has been sent'
                }
            };
        }catch (error){
            return errorHandler(error);
        }
    }

    /// Register bod
    registerBod = async (req) => {
        try{
            // Validate data
            const schema = joi.object({
                email: joi.string().email().required(),
            });
            const {error, value} = schema.validate(req.body);
            if (error) newError(400, error.details[0].message, 'RegisterBod Service');

            // Check if user exist
            const checkUser = await this.db.AuthUser.findOne({where : {email: value.email}});
            if (checkUser) newError(400, 'Email sudah terdaftar', 'RegisterBod Service');

            // Generate random nama_pengguna
            let isUnique = false;
            let countRandom = 0;
            while(!isUnique){
                const username = value.email.split('@')[0] + (countRandom <= 0 ? '' : randomstring.generate(countRandom));
                const checkUsername = await this.db.AuthUser.findOne({where : {nama_pengguna: username}});
                if (checkUsername == null) {
                    isUnique = true;
                    value.nama_pengguna = username;
                }
                countRandom++;
            }

            // Generate Random password
            const randomPassword = randomstring.generate(8);
            const kata_sandi = await hashPassword(randomPassword);

            // Create user
            const user = await this.db.AuthUser.create({
                nama_pengguna: value.nama_pengguna,
                email: value.email,
                status: 'active',
                role: 'bod',
                id_peternakan: req.dataAuth.id_peternakan,
                kata_sandi
            });
            if (!user) newError(500, 'Gagal menambahkan pengguna baru', 'RegisterBod Service');

            bodEmailRegister(value.email, randomPassword);

            return {
                code: 200,
                data: {
                    message: 'Email has been sent',
                    id_user: user.id_user,
                    email: user.email,
                    createdAt: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
                }
            };
        }catch (error){
            return errorHandler(error);
        }
    }

    // Update photo profile
    uploadImage = async (req, res, next) => {
        const t = await this.db.sequelize.transaction();
        try {
            // Remove old image
            if(!req.file) newError(400, 'Gambar tidak ditemukan', 'UploadImage Service');

            const checkUser = await this.db.AuthUser.findOne({where : {id_user: req.dataAuth.id_user}});
            if (!checkUser) newError(400, 'Pengguna tidak ditemukan', 'UploadImage Service');

            const image = req.file.filename;

            if(fs.existsSync(__basedir + '/public/static/images/' + image)){
                const updatedImage = await this.db.AuthUser.update({image: image}, {where: {id_user: req.dataAuth.id_user}, transaction: t});
                console.log(image)
                if (updatedImage <= 0) {
                    fs.unlinkSync(__basedir + '/public/static/images/' + image);
                    newError(500, 'Gagal mengupdate gambar', 'UploadImage Service');
                }

                if (checkUser.dataValues.image != null) {
                    const path = __basedir + '/public/static/images/' + checkUser.dataValues.image;
                    if (fs.existsSync(path)) {
                        fs.unlinkSync(path);
                    }
                }
            }else{
                newError(500, 'Gagal mengupload gambar', 'UploadImage Service');
            }

            // Commit transaction
            await t.commit();
            return {
                code: 200,
                data: {
                    id_user: req.dataAuth.id_user,
                    updatedAt: date.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
                }
            };
        } catch (error) {
            await t.rollback();
            return errorHandler(error);
        }
    }

    deleteImage = async (req, res, next) => {
        const t = await this.db.sequelize.transaction();
        try {
            const checkUser = await this.db.AuthUser.findOne({where : {id_user: req.dataAuth.id_user}});
            if (!checkUser) newError(400, 'Pengguna tidak ditemukan', 'DeleteImage Service');

            if (checkUser.dataValues.image != null) {
                const updatedImage = await this.db.AuthUser.update({image: null}, {where: {id_user: req.dataAuth.id_user}, transaction: t});
                if (updatedImage <= 0) newError(500, 'Gagal menghapus gambar', 'DeleteImage Service');

                const path = __basedir + '/public/static/images/' + checkUser.dataValues.image;
                if (fs.existsSync(path)) {
                    fs.unlinkSync(path);
                }

                // Commit transaction
                await t.commit();
                return {
                    code: 200,
                    data: {
                        id_user: req.dataAuth.id_user,
                        updatedAt: new Date()
                    }
                }
            }else{
                newError(400, 'Gambar tidak ditemukan', 'DeleteImage Service');
            }
        } catch (error) {
            await t.rollback();
            return errorHandler(error);
        }
    }

}

module.exports = (db) => new _auth(db);