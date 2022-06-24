/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import express = require('express');
import Business = require('./../app/business/FileBusiness');
import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/FileModel');
import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');
import UserReq = require('../middleware/UserReq');
import JwtUser = require('../app/model/interfaces/JwtUser');

class Controller extends BaseController<IModel, Business> {

    constructor(protected ctor: ParameterlessConstructor<Business>) {
        super(ctor);
    }

    check(doc:IModel, user:JwtUser) {
        // only org admins of an org can create a mission
        if (user.roles.indexOf("admin") > -1) {
            return true;
        }


        if (doc.target_type == "mission") {
            
        }

        /*
        if (user.orgs.indexOf(doc.org.toString()) == -1) {
            return false;
        }*/

        //if (doc.state == 'locked') {
        //    return false;
        //}



        return true;
    }


}
export = Controller;
