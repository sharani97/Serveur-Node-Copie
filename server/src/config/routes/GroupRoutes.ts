/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import express = require('express');
import Controller = require('./../../controllers/GroupController');
import Business = require('./../../app/business/GroupBusiness');
import Permits = require('./../../middleware/Permits');

import BaseRoutes = require('./BaseRoutes');
const router = express.Router();

class Routes extends BaseRoutes<Controller> {

    constructor () {
        super();
        this._controller = new Controller(Business);
        this._permits = new Permits('groups');
        this.router = router;
    }

    protected appendRoutes() {
        // this.router.get('/countries/:_ids',  this._permits.checkRole, this._controller.findCountries);
        // this.router.get('/country/:_countrycode', this._permits.checkRole, this._controller.retrieve);

        this.router.put('/:_id/invite', this._permits.checkRole, this._controller.inviteUsers);
        this.router.put('/:_id/invite/:email?', this._permits.checkRole, this._controller.inviteUsers);
        this.router.get('/:_id/members/', this._permits.checkRole, this._controller.getMembers);
        this.router.put('/:_id/remove', this._permits.checkRole, this._controller.removeUsers);
        this.router.put('/:_id/remove/:email?', this._permits.checkRole, this._controller.removeUsers);
    }
}

Object.seal(Routes);
export = Routes;
