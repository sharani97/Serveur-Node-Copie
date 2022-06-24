
import express = require('express');

import configAuth = require('./../config/constants/auth');
import User = require('./../app/dataAccess/schemas/UserSchema');
import UserModel = require('./../app/model/UserModel');

class SearchController  {

    constructor () {
    }

    like(req: express.Request, res: express.Response): void {

        try {
            res.send({test:'ok'});
        } catch (e)  {
            console.log(e);
            res.send({'error': 'error in your request'});

        }
    }

    starts_with(req: express.Request, res: express.Response): void {
        try {

            let _token: string = req.body.pass;
            let _email: string = req.body.email;

            User.findOne({ 'email' : _email}, function(err, user) {

                if (err) {
                    res.json({error:err});
                    return;
                }

                if (user) {
                }
            });
        } catch(e) {
            console.log(e);
            res.send({'error': 'error in your request'});
        }
    }

}

export = SearchController;