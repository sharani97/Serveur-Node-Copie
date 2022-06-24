
import express = require('express');

import jwt        = require('jsonwebtoken');

import * as errors from '../config/messages/errors';

import configAuth = require('./../config/constants/auth');

import User = require('./../app/dataAccess/schemas/UserSchema');
import UserModel = require('./../app/model/UserModel');
import UserData = require('./../app/model/interfaces/UserData');

import bcrypt     = require('bcrypt');
import Constants = require('../config/constants/constants');
import CoreController = require('./CoreController');

import idify = require('../app/dataAccess/schemas/makeId');

import mongoose = require('mongoose');
import { UserUtilities } from '../app/utilities/UserUtilities';

class CheckController extends CoreController {

    constructor () {
        super();
        this.checkAvailability = this.checkAvailability.bind(this);
    }




    checkAvailability(req: express.Request, res: express.Response): void {
        try {

            let _param: string = req.params._param;
            let _value: string = req.params._value;

            if (_param != "email" && _param != "username") {
                this.requestError(res, {error:"incorrect_parameter"});
                return;
            }

            UserUtilities.checkAvailability(_param, _value).then((ok) => {
                this.sendResult(res, null, { available:ok, param:_param, value:_value});
            });

        } catch (e)  {
            console.log(e);
            res.send({'error': 'error in your request'});
        }
    }


}

export = CheckController;
