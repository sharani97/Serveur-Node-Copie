/**
 * Created by D. Hockley.
 */

import express = require('express');
import Controller = require('./../../controllers/EpisodeController');
import Business = require('./../../app/business/EpisodeBusiness');
import Permits = require('./../../middleware/Permits');
import BaseRoutes = require('./BaseRoutes');
let router = express.Router();

class Routes extends BaseRoutes<Controller> {

    constructor () {
        super();
        this._controller = new Controller(Business);
        this._permits = new Permits('episodes');
        this.router = router;
    }

    protected appendRoutes() {
    }
}

Object.seal(Routes);
export = Routes;