/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import express = require('express');
import Business = require('./../app/business/UrlBusiness');
import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/UrlModel');
import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');

class Controller extends BaseController<IModel, Business> {

    constructor(protected ctor: ParameterlessConstructor<Business>) {
        super(ctor);
    }

}
export = Controller;
