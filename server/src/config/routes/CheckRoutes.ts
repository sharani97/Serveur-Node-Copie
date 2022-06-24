/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import express = require('express');
import Controller = require('./../../controllers/CheckController');

let router = express.Router();

class CheckRoutes {
    private _controller: Controller;

    constructor () {
        this._controller = new Controller();
    }

    get routes () {
        const controller = this._controller;
        router.use('/:_param/:_value',  controller.checkAvailability);
        return router;
    }


}

Object.seal(CheckRoutes);
export = CheckRoutes;