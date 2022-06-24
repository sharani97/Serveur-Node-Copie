/**
 * Created by D. Hockley.
 */

import express = require('express');
import settings = require('./../config/constants/globals');

import JwtUser = require('../app/model/interfaces/JwtUser');
import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');


import { UserUtilities } from './../app/utilities/UserUtilities';

import Business = require('./../app/business/EntityBusiness');
import Entity = require('./../app/dataAccess/schemas/EntitySchema');
import User = require('./../app/dataAccess/schemas/UserSchema');

import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/EntityModel');

import UserModel = require('./../app/model/interfaces/UserModel');
import UserReq = require('../middleware/UserReq');

import * as errors from '../config/messages/errors';
import * as jobtypes from './../config/constants/jobtypes';

let config = require('config');

class Controller extends BaseController<IModel, Business> {


    constructor(protected ctor: ParameterlessConstructor<Business>) {
        super(ctor);

        // this.promoteUser = this.promoteUser.bind(this);
        // this.promoteUsers$ = this.promoteUsers$.bind(this);
        // this.promoteOneUser$ = this.promoteOneUser$.bind(this);
        this.check = this.check.bind(this);

        this.promoteAdmin = this.promoteAdmin.bind(this);
        this.promoteOrgAdmin = this.promoteOrgAdmin.bind(this);

        this.demoteAdmin = this.demoteAdmin.bind(this);

        /*
        this.demoteOrgAdmin = this.demoteOrgAdmin.bind(this);
        this.demoteUsers$ = this.demoteUsers$.bind(this);
        */
        /*this.getOrg$ = this.getOrg$.bind(this);
        this.countUsers$ = this.countUsers$.bind(this);
        this.getUniqueUsers$ = this.getUniqueUsers$.bind(this);
        this.userCount = this.userCount.bind(this);
        this.filterItem = this.filterItem.bind(this);*/

    }

    async get$(id):Promise<IModel> {
        return await this.getNew().findById$(id);
    }


    check(doc:IModel, user:JwtUser) {
        if (user.roles.indexOf('admin') != -1) {
            return true;
        }

        if (user.roles.indexOf('entadmin') != -1) {
            return (user.ents.indexOf(doc._id.toString())!= -1);
        }
        return false;
    }


    async promoteOneUser$(entity:IModel, email:string, promoter:JwtUser, entadmin = true):Promise<UserModel> {


        let roles = ['orgadmin']

        if (entadmin) {
            roles = ['entadmin']
        }

        let usr = await UserUtilities.getOrcreateUser(promoter, email, roles);
        if ((entity.admins.indexOf(usr._id) == -1) && (usr._id != promoter.id)) {

            let job = jobtypes.USER_PROMOTED_TO_ENT_ORGADMIN;
            if (entadmin) {
                job = jobtypes.USER_PROMOTED_TO_ENTADMIN
            } else {
                if (usr.status == 'pending') {
                    job = jobtypes.USER_INVITED_TO_ENT_ORGADMIN;
                }
            }


            await this.addJob$(promoter, job, {
                email: email,
                ent: entity._id
            });
        }
        return usr;

    }


    async demoteUsers$(ent:IModel, emails:Array<string>, demoter:JwtUser):Promise<IModel> {

        let _emails = emails.map(email => email.toLowerCase());
        
        let users = await User.find({email:{$in:_emails}}).exec();
        let itms = ent.admins.map((itm) => itm as any).map((itm) => itm["_id"].toString());

        for(let user of users) {
            let index = itms.indexOf(user._id.toString());
            let index2 = itms.indexOf(user._id);
            if (index != -1) {
                ent.admins.splice(index,1);
                itms.splice(index,1);
            } 
        }
        await ent.save();
        return ent;
    }


    async promoteUsers$(entity:IModel, emails:Array<string>, promoter:JwtUser, entadmin = true):Promise<IModel> {
        try {

            let users: UserModel[] = [];
            for (let email of emails) {                
                let user = await this.promoteOneUser$(entity, email, promoter, entadmin);
                if (entadmin) {
                    if (entity.admins.indexOf(user._id) == -1) {
                        entity.admins.push(user._id);
                    }
                } else {
                    if (entity.orgadmins.indexOf(user._id) == -1) {
                        entity.orgadmins.push(user._id);
                    }
                }
            }

            await entity.save();
            return entity;
        } catch(err) {
            console.log(err);
            return null;
        }

    }

    promoteOrgAdmin(req: UserReq.IUserRequest, res: express.Response): void {
        this.promoteAdmin(req, res, false);
    }


    demoteAdmin(req: UserReq.IUserRequest, res: express.Response) {

        let usr:JwtUser = req.user;
        const id = req.params.id;
        const email = req.params.email;
        let emails:string[];
        emails = [];

        if (req.body.emails != undefined) {
            emails = req.body.emails.map(email => email.toLowerCase());
        }

        if (email != undefined) {
            emails.push(email.toLowerCase())
        }


        this.get$(id).then((entity) => {

            if (!entity) {
                this.requestError(res, errors.NO_SUCH_ORG);
                return;
            }

            if (!this.check(entity, usr)) {
                this.requestError(res, errors.FORBIDDEN, 403);
                return;
            }

            this.demoteUsers$(entity, emails, usr).then((data) => {
                if (data) {
                    res.json(data);
                } else {
                    this.requestError(res, "error.unable_to_demote", 400);
                }
            })
    
        });
    }

    promoteAdmin(req: UserReq.IUserRequest, res: express.Response, entadmin = true): void {

        let usr:JwtUser = req.user;
        const id = req.params.id;
        const email = req.params.email;

        if ((usr.roles.indexOf('admin') == -1) && (entadmin)) {
            this.requestError(res, errors.FORBIDDEN, 403);
            return;
        }

        let emails:string[];
        emails = [];

        if (req.body.emails != undefined) {
            emails = req.body.emails.map(email => email.toLowerCase());
        }

        if (email != undefined) {
            emails.push(email.toLowerCase())
        }

        this.get$(id).then((org) => {

            if (!org) {
                this.requestError(res, errors.NO_SUCH_ENTITY);
                return;
            }

            if (!this.check(org, usr)) {
                this.requestError(res, errors.FORBIDDEN, 403);
                return;
            }

            this.promoteUsers$(org, emails, usr, entadmin).then((data) => {
                if (data) {
                    res.json(data);
                } else {
                    this.requestError(res, "error creating user(s)", 400);
                }
            })
    


        });
    }


    create(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;

            let doc = <IModel>req.body;
            // org uses default settings
            let _settings = config.get('settings');
            if (doc.settings == undefined) {
                doc.settings = _settings;
            }
            for (let key in _settings) {
                if (doc.settings.hasOwnProperty(key) == false) {
                    doc.settings[key] = _settings[key];
                }
            }


            // does the group exist ?
            let emails:string[];
            emails = [];

            if (req.body.email_admin) {
                emails = req.body.email_admin;
            }

            if (this.check(doc, user)) {

                this.getNew().create(<IModel>req.body, (error: Error, result) => {
                    if (error) {
                        this.requestError(res,error,400);
                        return;
                    }
                    this.promoteUsers$(result, emails, user).then((org) => {
                        this.sendResult(res, error, org);
                    });
                });
             } else {
                 this.requestError(res, errors.FORBIDDEN, 403);
             }

        } catch (e)  {
            this.requestError(res, e);
        }
    }

}
export = Controller;