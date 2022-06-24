/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import express = require('express');
import Controller = require('./../../controllers/OrganizationController');
import Business = require('./../../app/business/OrganizationBusiness');
import Permits = require('./../../middleware/Permits');

import BaseRoutes = require('./BaseRoutes');
const router = express.Router();

class Routes extends BaseRoutes<Controller> {

    constructor () {
        super();
        this._controller = new Controller(Business);
        this._permits = new Permits('orgs');
        this.router = router;
    }

    protected appendRoutes() {
        // /api/orgs/${shared.testOrg.id}/promote/test@test.org
        this.router.put('/:id/promote/:email?',  this._permits.checkRole, this._controller.promoteOrgAdmin);
        this.router.put('/:id/demote/:email?',  this._permits.checkRole, this._controller.demoteOrgAdmin);
        this.router.get('/:id/usercount',  this._permits.checkRole, this._controller.userCount);
        
        // this.router.put('/id/:id/promote/:email',  this._permits.checkRole, this._controller.promoteOrgAdminWithId);
        // this.router.get('/country/:_countrycode', this._permits.checkRole, this._controller.retrieve);
    }
}

Object.seal(Routes);
export = Routes;
