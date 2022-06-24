
import express = require('express');

import configAuth = require('./../config/constants/auth');
import User = require('./../app/dataAccess/schemas/UserSchema');
import UserModel = require('./../app/model/UserModel');
import bcrypt     = require('bcrypt');
//import OAuth = require('oauth');

class TestController  {

    constructor () {
    }
        /*
    testNode(error, login, res,  ) {


        // public key : f7bc0d8d8e6b4e06a737e74fcc266977
        // privat key : 8b17a6fc273e4bb6ba313ccd97b3a160

         f9c4b8e81ea5403a4d21392ecd425dae15192806
        let oauth = new OAuth.OAuth(
      null,
      null,
      'f7bc0d8d8e6b4e06a737e74fcc266977',
      '8b17a6fc273e4bb6ba313ccd97b3a160',
      '1.0',
      null,
      'HMAC-SHA1'
    );
    oauth.get(
      'https://api.mambo.io/api/v1/sites/data',
      'your user token for this app', //test user token 
      'your user secret for this app', //test user secret             
      function (e, data, res){
        if (e) console.error(e);        

        console.log(data);
        done();      
      });    

        done();
      });

    }*/

}

export = TestController;