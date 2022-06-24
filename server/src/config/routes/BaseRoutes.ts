/**
 * Created by D. Hockley.
 */

//import Router = require('express');
import IReadController = require('./../../controllers/interfaces/ReadController');
import IWriteController = require('./../../controllers/interfaces/WriteController');

import BaseController = require('./../../controllers/BaseController');
import BaseBusiness = require('./../../app/business/BaseBusiness');
import BaseRepository = require('./../../app/repository/BaseRepository');
import Permits = require('./../../middleware/Permits');
//import mongoose = require('mongoose');

//let this.router = express.this.Router();

class Routes<Controller extends IReadController & IWriteController> {
    protected _controller: Controller;
    protected _permits: Permits;
    protected router: any;
    constructor () {
    }

    protected appendRoutes() {
    }


    get routes () {
        let controller = this._controller;
        let acl = this._permits;
        this.router.use(acl.getUser);

        this.appendRoutes();

        this.router.put('/:_id/:_field/:_value/:_name?', acl.checkRole, controller.setField);
        this.router.put('/:_id', acl.checkRole, controller.update);


        this.router.get('/search',  acl.checkRole, controller.search);
        this.router.get('/find/:_text',  acl.checkRole, controller.searchText);
        this.router.get('/range/:_param/:_value0/:_value1',  acl.checkRole, controller.findRange);
        this.router.get('/findname/:_name',  acl.checkRole, controller.findName);
        this.router.get('/count',  acl.checkRole, controller.count);
        this.router.get('/page/:_page',  acl.checkRole, controller.retrievePage);
        this.router.get('/page/:_page/size/:_pagesize',  acl.checkRole, controller.retrievePage);

        this.router.get('/after/:_date', acl.checkRole, controller.findQuery);
        this.router.get('/:_param/:_value/after/:_date',  acl.checkRole, controller.findQuery);
        this.router.get('/:_param/:_value',  acl.checkRole, controller.findQuery);

        this.router.get('/:_param/like/:_value',  acl.checkRole, controller.findLike);
        this.router.get('/:_param/like/:_value/:_param2/:_value2',  acl.checkRole, controller.findLike);
        this.router.get('/:_param/like/:_value/top/:_limit/:_criterion',  acl.checkRole, controller.findTopLike);
        this.router.get('/:_id',  acl.checkRole, controller.findById);
        this.router.get('/', acl.checkRole, controller.retrieve);

        this.router.delete('/:_id/:_field',  acl.checkRole, controller.deleteField);
        this.router.delete('/:_id',  acl.checkRole, controller.delete);

        this.router.post('/:_id/action/:_action',  acl.checkRole, controller.action);
        this.router.post('/',  acl.checkRole, controller.create);
        return this.router;
    }


}
Object.seal(Routes);
export = Routes;