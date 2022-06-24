/**
 * Created by D. Hockley.
 */
import express = require('express');
// import IReadController = require('./interfaces/ReadController');
import IController = require('./interfaces/Controller');
import IBaseBusiness = require('../app/business/common/BaseBusiness');

import JwtUser = require('../app/model/interfaces/JwtUser');

import BaseController = require('./BaseController');

import mongoose = require('mongoose');
import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');

import Constants = require('../config/constants/constants');

// const querystring = require('querystring');
/*interface ParameterlessConstructor<T> {
    new (): T;
}*/


class BaseOrgController <Doc extends mongoose.Document, Business extends IBaseBusiness<any>>
        extends BaseController<Doc, IBaseBusiness<any>>                        
        implements IController<mongoose.Document,IBaseBusiness<any>>
                         {

    public type:string;


    constructor(protected ctor: ParameterlessConstructor<Business>) {
        super(ctor);
    }



}
export = BaseController;