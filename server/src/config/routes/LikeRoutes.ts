/**
 * Created by D. Hockley.
 */

import express = require('express');
import Controller = require('./../../controllers/LikeController');
import Business = require('./../../app/business/LikeBusiness');
import Permits = require('./../../middleware/Permits');
import BaseRoutes = require('./BaseRoutes');
let router = express.Router();

class Routes extends BaseRoutes<Controller> {

    constructor () {
        super();
        this._controller = new Controller(Business);
        this._permits = new Permits('likes');
        this.router = router;
    }

    protected appendRoutes() {
    }
}

Object.seal(Routes);
export = Routes;