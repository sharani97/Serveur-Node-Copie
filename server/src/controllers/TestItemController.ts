/**
 * Created by D. Hockley.
 */
import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');
import Business = require('./../app/business/TestItemBusiness');
import BaseController = require('./BaseController');
//import IModel = require('./../app/model/interfaces/TestItemModel');
import UserReq = require('../middleware/UserReq');
import express = require('express');
import mongoose = require('mongoose');
//import TestItem = require('../app/dataAccess/schemas/TestItemSchema')
import { TestItem as IModel} from '../app/model/TestItem';

class Controller extends BaseController<IModel, Business> {

    constructor(protected ctor: ParameterlessConstructor<Business>) {
        super(ctor);
    }

    
    /*
    setRead
    */
}
export = Controller;