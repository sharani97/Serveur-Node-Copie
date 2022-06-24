/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import express = require('express');
import Controller = require('./../../controllers/EntityController');
import Business = require('./../../app/business/EntityBusiness');
import Permits = require('./../../middleware/Permits');

import BaseRoutes = require('./BaseRoutes');
const router = express.Router();

class Routes extends BaseRoutes<Controller> {

    constructor () {
        super();
        this._controller = new Controller(Business);
        this._permits = new Permits('entities');
        this.router = router;
    }

    protected appendRoutes() {

        this.router.put('/:id/promote/:email?',  this._permits.checkRole, this._controller.promoteAdmin);
        this.router.put('/:id/orgpromote/:email?',  this._permits.checkRole, this._controller.promoteOrgAdmin);

        this.router.put('/:id/demote/:email?',  this._permits.checkRole, this._controller.demoteAdmin);
        //this.router.get('/:id/usercount',  this._permits.checkRole, this._controller.userCount);

        /*
        this.router.put('/:id/promote/:email?',  this._permits.checkRole, this._controller.promoteAdmin);
        this.router.put('/:id/demote/:email?',  this._permits.checkRole, this._controller.demoteAdmin);
        this.router.get('/:id/usercount',  this._permits.checkRole, this._controller.userCount);
        */
    }
}

Object.seal(Routes);
export = Routes;
