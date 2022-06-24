/**
 * Created by D. Hockley.
 */
import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');
import Business = require('./../app/business/NotifBusiness');
import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/NotifModel');
import UserReq = require('../middleware/UserReq');
import express = require('express');
import mongoose = require('mongoose');
import Notif = require('../app/dataAccess/schemas/NotifSchema')

class Controller extends BaseController<IModel, Business> {

    constructor(protected ctor: ParameterlessConstructor<Business>) {
        super(ctor);
    }

    
    /*
    setRead
    */
}
export = Controller;