/**
 * Created by D. Hockley.
 */

import express = require('express');
import Controller = require('./../../controllers/UserController');
import Permits = require('./../../middleware/Permits')
import Business = require('./../../app/business/UserBusiness');

import BaseRoutes = require('./BaseRoutes');
let router = express.Router();

class Routes extends BaseRoutes<Controller> {

    constructor () {
        super();
        this._controller = new Controller(Business);
        this._permits = new Permits('users');
        this.router = router;

    }
    protected appendRoutes() {
        this.router.put('/:_email/password', this._permits.checkRole, this._controller.updatePassword);
    }
}

Object.seal(Routes);
export = Routes;