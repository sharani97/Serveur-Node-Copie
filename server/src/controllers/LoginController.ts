
import express = require('express');

import jwt        = require('jsonwebtoken');

import * as errors from '../config/messages/errors';

import * as jobtypes from '../config/constants/jobtypes';

import configAuth = require('./../config/constants/auth');

import User = require('./../app/dataAccess/schemas/UserSchema');
import Points = require('./../app/dataAccess/schemas/PointsSchema');
import PointsModel = require('./../app/model/interfaces/PointsModel');
import IPoints = require('./../app/model/interfaces/Points');


import * as reward from '../config/constants/rewards';


import UserModel = require('./../app/model/UserModel');
import IUserModel = require('./../app/model/interfaces/UserModel');


import UserData = require('./../app/model/interfaces/UserData');

import RegistrationData = require('./../app/model/interfaces/RegistrationData');

import bcrypt     = require('bcrypt');
import Constants = require('../config/constants/constants');
import CoreController = require('./CoreController');

import Org = require('./../app/dataAccess/schemas/OrganizationSchema');
import Entity = require('./../app/dataAccess/schemas/EntitySchema');

import Group = require('./../app/dataAccess/schemas/GroupSchema');

import mongoose = require('mongoose');
import JwtUser = require('../app/model/interfaces/JwtUser');
import { UserUtilities } from '../app/utilities/UserUtilities';

import rewards = require('../config/constants/rewards');
import { strictEqual } from 'assert';

let config = require("config")


class LoginController extends CoreController {

    constructor () {
        super();
        this.register = this.register.bind(this);
        this.pass_authenticate = this.pass_authenticate.bind(this);
        this.google_authenticate = this.google_authenticate.bind(this);
        this.makeUserData$ = this.makeUserData$.bind(this);
        this.refreshToken = this.refreshToken.bind(this);
        this.confirmEmail = this.confirmEmail.bind(this);
        this.confirmEmail$ = this.confirmEmail$.bind(this);
        this.resetPasswordStart = this.resetPasswordStart.bind(this);
        this.resetPasswordConfirm = this.resetPasswordConfirm.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
    }

    
    async setupUserPoints$(user:IUserModel):Promise<Array<IPoints>> {


        await UserUtilities.rewardUser$(undefined, user._id, rewards.ACCOUNT_CREATED);

        let pts = await Points.find({user:user._id}).exec();

        let _pts = [] as IPoints[];

        for (let _pt of pts) {

            let pt:IPoints;
            if (_pt.hasOwnProperty("toObject")) {
                pt = _pt.toObject() as IPoints;
            } else {
                pt = _pt as IPoints;
            }

            delete pt["user"];
            delete pt["__v"];
            _pts.push(pt);

        }

        return _pts;
    }

    async getToolUser():Promise<JwtUser> {

        let toolUser = await User.findOne({'roles':`tool`}).exec();

        if (toolUser == null) {
            //tool_user = create_user('JOBS_TOOL', 'tool@{}'.format(domain), ['tool'], 'created', True)
            //create_user(name, email, roles, status = 'pending', validated = False):
            
            let config = require('config');
            let domain =  config.get('email-domain');

            let usrdata = {
                'email': `tool@{domain}`,
                'username':'JOBS_TOOL',
                'id':'JOBS_TOOL',
                'roles': ['tool'],
                'validated':true,
                'status': 'created',
            }
            toolUser = new User(usrdata);
            await toolUser.save()
        }

        let jwtToolUser:JwtUser = {
            id: toolUser._id.toString(),
            //name: toolUser.username,
            username: "JOBS_TOOL",
            roles: toolUser.roles, 
            orgs:[],
            ents:[],
            missions:[],
            points:{}
        }

        return jwtToolUser;

    }

    async makeJWT(user:IUserModel, short = false, userData:UserData = undefined):Promise<string> {

        if (short) {
            let claims = {
                sub: user._id,
                iss: Constants.APPNAME,
                scope: user.roles, //,
                username: user.username,
            }
            return jwt.sign(
                claims,
                configAuth.jwtSecret,
                {
                    expiresIn: 24*60*60 // expires in 24 hours
                }
            );
        }

        if (userData == undefined) {
            userData = await this.makeCoreUserData$(user);
        }

        let claims = {
            sub: user._id,
            iss: Constants.APPNAME,
            username: user.username,
            name: user.name,
            //ent_org:ent_org_ids,
            orgs: userData.orgs,
            ent_orgs:userData.entorgs,
            ents:userData.ents,
            scope: user.roles//,
            //points:pts
        }

        return jwt.sign(
            claims,
            configAuth.jwtSecret,
            {
                expiresIn: 24*60*60 // expires in 24 hours
            }
        );

    }

    async makeCoreUserData$(user:IUserModel, with_points = false):Promise<UserData> {


        let user_id = new mongoose.Types.ObjectId(user._id);

        let orgs =  await Org.find({'admins':user_id}).exec();
        let ents = await Entity.find({'admins':user_id}).exec();
        let ent_orgs = await Entity.find({'orgadmins':user_id}).exec();

        let org_admin_ids = orgs.map((org) => org._id);
        let ent_ids = ents.map((ent) => ent._id);
        let ent_org_ids = ent_orgs.map((ent) => ent._id);

        let pts:PointsModel[] = [];

        if (with_points) {
            if (user.points) {
                pts = user.points;
            } else {
                pts = await Points.find({user:user_id}).exec();
            }
        }

        let _pts = [] as IPoints[];

        for (let _pt of pts) {

            if (_pt.hasOwnProperty("toObject")) {
                let pt = _pt.toObject() as IPoints;
                delete pt["user"];
                delete pt["__v"];
                _pts.push(pt);
            } else {
                delete _pt["user"];
                delete _pt["__v"];
                _pts.push(_pt as IPoints);
            }
        }

        let short_jwt = await this.makeJWT(user, true);

        return {
            _id : user._id,
            username : user.username,
            name: user.name,
            profileUrl:user.profileUrl,
            first_name:user.first_name,
            roles : user.roles,
            orgs:org_admin_ids,
            ents:ent_ids,
            points:_pts,
            entorgs:ent_org_ids,
            //jwt: jwttoken,
            short_jwt: short_jwt,
            settings:user.settings
        };
    }


    async makeUserData$(user, pts:Array<PointsModel> = undefined):Promise<UserData> {


        let userData = await this.makeCoreUserData$(user, true)

        let jwttoken = await this.makeJWT(user, false, userData)

        return {
            _id : user._id,
            username : user.username,
            name: user.name,
            profileUrl:user.profileUrl,
            first_name:user.first_name,
            roles : user.roles,
            orgs:userData.orgs,
            entorgs:userData.entorgs,
            ents:userData.ents,
            points:userData.points,
            jwt: jwttoken,
            short_jwt: userData.short_jwt,
            settings:user.settings
        };
    }


    refreshToken(req: express.Request, res: express.Response): void {
    }

    async confirmEmail$(decoded):Promise<any> {


        let scopes = decoded["scope"];
        let found = false;
        for (let scope of scopes) {
            if (scope == "validate_email") {
                found = true;
                break;
            }
        }

        if (found == false) {
            throw new Error(errors.EMAIL_VALIDATION_WRONG_SCOPE);
        }

        let usr = await User.findById(decoded["sub"]);
        if (usr.email != decoded["email"]) {
            throw new Error(errors.EMAIL_VALIDATION_WRONG_EMAIL);
        }

        if (usr.validated == true) {
            return {"message":errors.EMAIL_VALIDATION_ALREADY_DONE}
        }

        usr.validated = true;
        await usr.save();

        return {"message":"ok"};
    }

    errorView(res:express.Response, message_title:string, message_text:string){

        let data = {
            "title":message_title,
            "maintext":message_text
        }

        res.render('error.html', data);
    }

    async updatePassword(user:IUserModel, password:string):Promise<void> {
        user.token = await bcrypt.hash(password, 3);
        await user.save()
    }

    resetPasswordConfirm(req: express.Request, res: express.Response): void {

        let host = ( req.headers.host.match(/:/g) ) ? req.headers.host.slice( 0, req.headers.host.indexOf(":") ) : req.headers.host
        //let host = req.get('host');
        let protocol = req.protocol
        let link = protocol+'://'+host+'/';

        let password = req.body.password;
        let password2 = req.body.password2;

        let _jwt = req.body.jwt;
        let _id0 = req.body._id;
        let payload = jwt.decode(_jwt);

        let _id = payload.sub;
        let email = payload.email;

        if (password != password2) {
            this.errorView(res, "Mot de passe incohérents", "les mots de passe ne correspondent pas, merci de réessayer.");
            return;
        }

        User.findById(_id).exec().then((user) => {
            // get token
            let secret = user.token;
            if (email != user.email) {
                this.errorView(res, "Email Mismatch", "l'email ne correspond pas");
                return;
            }

            // verifiy with current token
            jwt.verify(_jwt, secret, (err, decoded) => {
                
                if (err) {
                    this.requestError(res, err);
                    return;
                }

               if (decoded) {

                    this.updatePassword(user, password).then(() => {
                        let data = {
                            "title":"Bravo",
                            "maintext":"Votre mot de passe a bien été réinitialisé, vous pouvez essayer de vous connecter"
                        };                
                        res.render('ok.html', data);
                    }).catch((e) => {
                        this.requestError(res, err);
                    });


                    
                } else {
                    this.errorView(res, 
                        "Erreur de validation",
                        "Le token a expiré ou n'est pas valide");
                };
            });
        });

    }

    async forgotPassword$(email):Promise<boolean> {

        let usr = await User.findOne({"email":email}).exec();
        
        if (usr == null) {
            return false; 
        } 

        let jwtToolUser = await this.getToolUser();
        await this.addJob$(jwtToolUser, jobtypes.FORGOTTEN_PASSWORD, {"email":email, "target":usr._id});
        return true

    }

    forgotPassword(req: express.Request, res: express.Response): void {
    
        try {
            let _email = req.params._email;
            this.forgotPassword$(_email).then((ok) => {
                // if ok = false then log bad email 
                this.sendResult(res, null, {"status":true})
            }) 
        } catch(err) {
            this.requestError(res,err);
        }
    }



    resetPasswordStart(req: express.Request, res: express.Response): void {

        let host = ( req.headers.host.match(/:/g) ) ? req.headers.host.slice( 0, req.headers.host.indexOf(":") ) : req.headers.host

        //let host = req.get('host');
        let protocol = req.protocol
        let link = protocol+'://'+host+'/';

        let _jwt = req.params._jwt;

        let payload = jwt.decode(_jwt);
        let _id = payload.sub;
        let email = payload.email;

        User.findById(_id).exec().then((user) => {

            // get token
            let secret = user.token;
            if (email != user.email) {
                this.errorView(res, "Email Mismatch", "l'email ne correspond pas");
                return;
            }


            // verifiy with current token
            jwt.verify(_jwt, secret, (err, decoded) => {

                if (err) {
                    this.requestError(res, err);
                    return;
                }

               if (decoded) {

                    // set new password 

                    let data = {
                        "title":"Reset du mot de passe",
                        "maintext":"Merci de saisir votre nouveau mot de passe",
                        "jwt":_jwt, 
                        "_id":_id,
                    }

                    res.render('reset.html', data);

                } else {
                    this.errorView(res, 
                        "Erreur de validation",
                        "Le token a expiré ou n'est pas valide");
                };
            });
        });

    }

    confirmEmail(req: express.Request, res: express.Response): void {

        let host = ( req.headers.host.match(/:/g) ) ? req.headers.host.slice( 0, req.headers.host.indexOf(":") ) : req.headers.host

        //let host = req.get('host');
        let protocol = req.protocol
        let link = protocol+'://'+host+'/';

        let _jwt = req.params._jwt;
        jwt.verify(_jwt, configAuth.jwtSecret, (err, decoded) => {
            if (err) {
                this.requestError(res, err);
                return;
            }

            if (decoded) {
                this.confirmEmail$(decoded).then((result) => {


                    let data = {
                        "title":"Email confirmed",
                        "maintext":"Your email has been confirmed, thank you. \n Votre email a été confirmé, merci!",
                        "link":link,
                        "color":"#BBDEFB",
                        "light_color":"#BBDEFB",
                        "call_to_action":"Application",
                    }

                    res.render('simple.html', data);

                    //this.sendResult(res, null, result);


                }).catch( (e) => {
                    let data = {
                        "title":"Error in validation",
                        "maintext":e,
                        "link":link,
                        "color":"#BBDEFB",
                        "light_color":"#BBDEFB",
                        "call_to_action":"Application",
                    }

                    res.render('simple.html', data);
                });
            }


        });

    }

    async core_register$(data:RegistrationData):Promise<IUserModel> {

        let required = ["username", "password", "email"]
        for (let field of required) {
            if (data[field] == undefined) {
                throw new Error(errors.MISSING_PARAMETER.concat(field));
            }
        }

        data.email = data.email.toLowerCase();
        let id = data.email.split('@')[0];
        let user = await User.findOne({ 'email' : data.email}).exec();
        let token = await bcrypt.hash(data.password, 3);

        if (user) {
            // is user pending ?
            if (user.status != "pending") {
                throw new Error(errors.EMAIL_EXISTS);
            }
            user.token = token;
            user.username = data.username;
            user.id = data.username;
            if (data.name) user.name = data.name;
            if (data.first_name) user.first_name = data.first_name;
            if (data.profileUrl) user.profileUrl = data.profileUrl;
            user.status = 'created';
            user.activated = new Date();

            await user.save();

            let pts = await this.setupUserPoints$(user);
            //await pts.map(pt => pt.save());
            return user;
        }


        let newUser = new User({
            id: data.username.toLowerCase(),
            token: token,
            username: data.username,
            email: data.email,
            auth_type: 'email',
            roles: ['guest'],
            activated: new Date(), // looks like it might not be set here ??
            status:'created'
        });

        if (data.name) newUser.name = data.name;
        if (data.first_name) newUser.first_name = data.first_name;
        if (data.profileUrl) newUser.profileUrl = data.profileUrl;

        await newUser.save();
        // check we don't give them in python :P 

        //await UserUtilities.rewardUser$(undefined, newUser._id, rewards.ACCOUNT_CREATED);
        
        let userData = await this.makeUserData$(newUser);

        let jwtToolUser = await this.getToolUser();


        let validate =  await this.addJob$(jwtToolUser, jobtypes.USER_CREATED, {
            email: data.email,
            _id: newUser._id
        });

        let pts = await this.setupUserPoints$(newUser);
        //await pts.map(pt => pt.save());
        return newUser;

    }

    async register$(data:RegistrationData):Promise<UserData> {

        let usr = await this.core_register$(data);
        let userData = await this.makeUserData$(usr); // in graphql you get what you ask for
        return userData;
    }

    register(req: express.Request, res: express.Response): void {

        try {
            let data = <RegistrationData> req.body;
            this.register$(data).then((data) => {
                let ret = {data: data} //new UserModel(user).clientData};
                this.sendResult(res, null, ret);
            }).catch((e) => {
                this.requestError(res,e);
            });

        } catch(e) {
            this.requestError(res,e);
        }
    }

    async core_login$(email:string, password:string):Promise<IUserModel> {
        let _token: string = password;
        let _email: string = email.toLowerCase();
        let user = await User.findOne({ 'email' : _email}).exec();
        if (user && (user != undefined)) {

            let result = await bcrypt.compare(_token, user.token);
            if (result) {
                user.last_connexion = new Date();
                await user.save();
                return user;
            } else {
                throw new Error(errors.INCORRECT_PASSWORD);
            }
        } else {
            throw new Error( errors.NO_SUCH_USER);
        }
        
    }
    
    login$(root:any, body:{email:string, password:string}) {
        let _token: string = body.password;
        let _email: string = body.email.toLowerCase();

        this.core_login$(body.email, body.password).then((user)=> {
            this.makeUserData$(user).then((data) => {
                return data;
            });
        })

        User.findOne({ 'email' : _email}, (err, user) => {
            if (err) {
                throw new Error(err.message);
            }

            if (user) {

                bcrypt.compare(_token, user.token, (error, result) => {
                    if (error) {
                        throw new Error(error.message);
                    }

                    if (result && (result != undefined)) {
                        //res.json({data: new UserModel(user).clientData});
                        this.makeUserData$(user).then((data) => {
                            return data;
                        });
                    } else {
                        throw new Error(errors.INCORRECT_PASSWORD);
                    }

                });

            } else {
                throw new Error( errors.NO_SUCH_USER);
            }
        });
    }


    pass_authenticate(req: express.Request, res: express.Response): void {
        try {
            let _token: string = req.body.pass || req.body.password;
            let _email: string = req.body.email.toLowerCase();

            this.core_login$(_email, _token).then((user) => {
                this.makeUserData$(user).then((data) => {
                    let ret = {data: data} //new UserModel(user).clientData};
                    
                    this.sendResult(res, null, ret);
                });
            }).catch((err) => {
                console.log(err);
                this.requestError(res, err);
            });

        } catch (e)  {
            console.log(e);
            res.send({'error': 'error in your request'});

        }
    }
    google_authenticate(req: express.Request, res: express.Response): void {

        try {
            let _token: string = req.params._token;
            let GoogleAuth = require('google-auth-library');
            let auth = new GoogleAuth;
            let client = new auth.OAuth2(configAuth.googleClientId,'','');

            client.verifyIdToken(
                _token,
                configAuth.googleClientId,
                (e, login) => {

                    if (e) {
                      res.json({error:e});
                      return;
                    }

                    // If request specified a G Suite domain:
                    // let domain = payload['hd'];
                    let profile = login.getPayload();
                    let userid = profile.sub;
                    // If request specified a G Suite domain:
                    let domain = profile.hd; // if domain not valid => pb

                    // res.json(payload);
                    User.findOne({ 'google_id' : userid}, (err, user) => {

                        if (err) {
                            res.json({error:err});
                            return;
                        }

                        if (user) {
                            this.makeUserData$(user).then((data) => {
                                let ret = {data: data} //new UserModel(user).clientData};
                                res.json(ret);
                            });
                            return;
                        } else {
                            // res.json({error:err});
                            // if the user isn't in our database, create a new user

                            let email = (profile.emails && profile.emails[0].value) || profile.email;
                            let id = email.split('@')[0];

                            let userData = {
                                google_id: userid,
                                id: id,
                                username:id,
                                gtoken: _token,
                                name: profile.name,
                                email: email,
                                auth_type: 'google',
                                roles: ['guest']
                            };

                            let newUser;

                            try {
                                newUser  = new User(userData);
                            } catch (e)  {
                                console.log(e);
                                res.json({error: e});
                                return;
                            }

                            newUser.save((error: Error) => {
                                if (error) {
                                    console.log(error);
                                     res.json({error: error.message});
                                     return;
                                }
                                this.makeUserData$(newUser).then((data) => {
                                    let ret = {data: data} //new UserModel(user).clientData};
                                    res.json(ret);
                                });
                            });
                        }
                    });
                });
            } catch (e)  {
                console.log(e);
                res.send({'error': 'error in your request'});
            }
        }

        getConfig(req: express.Request, res: express.Response): void {
            let ret = {
                rewards: config.get("rewards")
            }
            res.json(ret);
        }
}

export = LoginController;
