/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import express = require('express');
import Controller = require('../../controllers/SystemEventController');
import Business = require('../../app/business/SystemEventBusiness');
import Permits = require('../../middleware/Permits');

import BaseRoutes = require('./BaseRoutes');
let router = express.Router();

class Routes extends BaseRoutes<Controller> {

    constructor () {
        super();
        this._controller = new Controller(Business);
        this._permits = new Permits('actions');
        this.router = router;
    }


}

Object.seal(Routes);
export = Routes;