/**
 * Created by D. Hockley.
 */
import express = require('express');

import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');
import JwtUser = require('../app/model/interfaces/JwtUser');

import Business = require('./../app/business/ConversationBusiness');
import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/ConversationModel');

class Controller extends BaseController<IModel, Business> {

    constructor(protected ctor: ParameterlessConstructor<Business>) {
        super(ctor);
    }
}
export = Controller;