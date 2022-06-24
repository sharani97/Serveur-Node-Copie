/**
 * Created by D. Hockley.
 */

import express = require('express');
import Controller = require('./../../controllers/PostController');
import Business = require('./../../app/business/PostBusiness');
import Permits = require('./../../middleware/Permits');
import BaseRoutes = require('./BaseRoutes');
let router = express.Router();

class Routes extends BaseRoutes<Controller> {

    constructor () {
        super();
        this._controller = new Controller(Business);
        this._permits = new Permits('posts');
        this.router = router;
    }

    protected appendRoutes() {
        this.router.get('/:_id/details/',  this._permits.checkRole, this._controller.details);
    }
}

Object.seal(Routes);
export = Routes;