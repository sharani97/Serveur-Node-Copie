/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import express = require('express');
import Controller = require('./../../controllers/LoginController');

let router = express.Router();

class LoginRoutes {
    private _controller: Controller;

    constructor () {
        this._controller = new Controller();
    }

    get routes () {
        const controller = this._controller;
        router.post('/password',  controller.pass_authenticate);
        router.post('/register',  controller.register);
        router.post('/refreshtoken',  controller.refreshToken);
        router.use('/validate/:_jwt',  controller.confirmEmail);
        router.post('/forgotpassword/:_email',  controller.forgotPassword);      

        router.get('/resetpassword/:_jwt',  controller.resetPasswordStart);      
        router.post('/resetpassword/',  controller.resetPasswordConfirm);   
        router.use('/authenticate/:_token',  controller.google_authenticate);
        router.get('/config',  controller.getConfig);
        return router;
    }


}

Object.seal(LoginRoutes);
export = LoginRoutes;