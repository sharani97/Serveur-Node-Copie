/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import express = require('express');
import Business = require('./../app/business/UserBusiness');
import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/UserModel');
import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');

import User = require('./../app/dataAccess/schemas/UserSchema');
import bcrypt     = require('bcrypt');
import idify = require('../app/dataAccess/schemas/makeId');

import * as errors from '../config/messages/errors';

class UserController extends BaseController<IModel, Business> {

    constructor (protected ctor: ParameterlessConstructor<Business>) {
        super(ctor);
        this.updatePassword = this.updatePassword.bind(this);
    }

    async setPassword$(_email, _password):Promise<void> {

        let user = await User.findOne({email:_email}).exec();

        if (user) {
            user.token = await bcrypt.hash(_password, 3);
            await user.save();
            return;
        }

        throw new Error(errors.NO_SUCH_USER);

    }


    updatePassword(req: express.Request, res: express.Response): void {
        try {
            const _pass: string = req.body.password;
            const _email: string = req.params._email;

            this.setPassword$(_email, _pass).then(() => {
                res.send({'success': 'success'});
            }).catch((e) => {
                this.requestError(res, e);
            });
        } catch (e)  {
            console.log(e);
            res.send({'error': 'error in your request'});

        }
    }

}
export = UserController;