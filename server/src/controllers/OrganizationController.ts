/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import express = require('express');
import Business = require('./../app/business/OrganizationBusiness');
import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/OrganizationModel');
import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');

import { UserUtilities } from '../app/utilities/UserUtilities';

import Org = require('./../app/dataAccess/schemas/OrganizationSchema');
import User = require('./../app/dataAccess/schemas/UserSchema');
import Job = require('./../app/dataAccess/schemas/JobSchema');
import Group = require('./../app/dataAccess/schemas/GroupSchema');
import Entity = require('./../app/dataAccess/schemas/EntitySchema');

import UserModel = require('./../app/model/interfaces/UserModel');
import JobModel = require('./../app/model/interfaces/JobModel');
import JwtUser = require('../app/model/interfaces/JwtUser');

import UserReq = require('../middleware/UserReq');

import settings = require('./../config/constants/globals');

import * as errors from '../config/messages/errors';
import * as jobtypes from './../config/constants/jobtypes';


let config = require('config');


class Controller extends BaseController<IModel, Business> {

    private userNb:number;
    private nameGen:any;

    constructor(protected ctor: ParameterlessConstructor<Business>) {
        super(ctor);

        // this.promoteUser = this.promoteUser.bind(this);
        this.promoteUsers$ = this.promoteUsers$.bind(this);

        this.promoteOrgAdmin = this.promoteOrgAdmin.bind(this);
        this.promoteOneUser$ = this.promoteOneUser$.bind(this);
        this.demoteOrgAdmin = this.demoteOrgAdmin.bind(this);
        this.demoteUsers$ = this.demoteUsers$.bind(this);

        this.check = this.check.bind(this);
        this.getOrg$ = this.getOrg$.bind(this);
        this.countUsers$ = this.countUsers$.bind(this);
        this.getUniqueUsers$ = this.getUniqueUsers$.bind(this);
        this.userCount = this.userCount.bind(this);
        this.filterItem = this.filterItem.bind(this);

    }

    filterItem(doc:IModel, user:JwtUser) {

        if (user.roles.indexOf('admin') != -1) {
            return true;
        }
        
        if (user.roles.indexOf('entadmin') != -1) {
            for (let _id of user.ents) {
                if (doc.entity.toString() == _id.toString()) return true;
            }
        }
        if ((user.roles.indexOf('orgadmin') != -1) || 
            (user.roles.indexOf('entadmin') != -1)){
            if (doc._id == undefined) {
                return true;
            }

            for (let _id of user.orgs) {
                if (doc._id.equals(_id)) return true;
            }

        }
        return false

    }

    check(doc:IModel, user:JwtUser) {

        if (user.roles.indexOf('admin') != -1) {
            return true;
        }

        if (user.roles.indexOf('entadmin') != -1) {

            if (user.ents.length == 0) {
                return false;
            }

            if (user.ents.length == 1) {
                if (!doc.entity) {
                    doc.entity = user.ents[0];
                    return true;
                }

                if (doc.entity == user.ents[0]) {
                    return true;
                }
            }

            if (user.ents.length > 1) {
                if (doc.entity) {
                    if (typeof(doc.entity) == "string") {
                        if (user.ents.indexOf(doc.entity) > -1) {
                            return true;
                        }
                    }
                } else {
                    return false;
                }
            }

        }

        if (user.roles.indexOf('orgadmin') != -1) {
            

            if (doc._id == undefined) {
                if (doc.entity == undefined) {
                    return false;
                }
                return true;
            }

            // these cannot be written by orgadmins
            if ((doc.max_mission_nb != undefined) || (doc.max_user_nb != undefined)) {
                return false;
            }

            return (user.orgs.indexOf(doc._id)!= -1);
        }

        return false;
    }

    // this can go in the business in fact ?
    async promoteOneUser$(org:IModel, email:string, promoter:JwtUser):Promise<UserModel> {

        let usr = await UserUtilities.getOrcreateUser(promoter, email, ['orgadmin']); // User.findOne({email:email}).exec();
        let entity = await Entity.findById(org.entity).exec();

        let jobtype = jobtypes.USER_PROMOTED_TO_ORGADMIN;

        if (usr.status == 'pending') {
            jobtype = jobtypes.USER_INVITED_TO_ORGADMIN;
        }

        if ((org.admins.indexOf(usr._id) == -1) && (usr._id != promoter.id)) {
            await this.addJob$(promoter, jobtype, {
                email: email,
                sender:promoter.username,
                org: org._id,
                entity:entity._id,
                orgname:org.name,
                entityname:entity.name
            });
        }

        return usr;

    }

    async getOrg$(id):Promise<IModel> {

        return await this.getNew().findById$(id, 'entity');
        /*
        let org = null;
        org = await Org.findById(id).populate({path:'entity'}).exec();
        return org;*/
    }

    async demoteUsers$(org:IModel, emails:Array<string>, demoter:JwtUser):Promise<IModel> {

        let _emails = emails.map(email => email.toLowerCase());
        let users = await User.find({email:{$in:_emails}}).exec();

        for(let user of users) {
            let index = org.admins.indexOf(user._id.toString());
            if (index != -1) {
                org.admins.splice(index,1);
            }
        }
        await org.save();
        return org;
    }



    async promoteUsers$(org:IModel, emails:Array<string>, promoter:JwtUser):Promise<IModel> {
        try {
            let roles = ['user', 'orgadmin']

            let users: UserModel[] = [];

            for (let email of emails) {

                let user = await this.promoteOneUser$(org, email, promoter);
                if (org.admins.indexOf(user._id) == -1) {
                    org.admins.push(user._id);
                }

                if (org.members.indexOf(user._id) == -1) {
                    org.members.push(user._id);
                }
                users.push(user);
            }

            await org.save();
            return org;
        } catch(err) {
            console.log(err);
            return null;
        }

    }

    demoteOrgAdmin(req: UserReq.IUserRequest, res: express.Response) {

        let usr:JwtUser = req.user;
        const org_id = req.params.id;
        const email = req.params.email;
        let emails:string[];
        emails = [];

        if (req.body.emails != undefined) {
            emails = req.body.emails.map(email => email.toLowerCase());
        }

        if (email != undefined) {
            emails.push(email.toLowerCase())
        }


        this.getOrg$(org_id).then((org) => {

            if (!org) {
                this.requestError(res, errors.NO_SUCH_ORG);
                return;
            }

            if (!this.check(org, usr)) {
                this.requestError(res, errors.FORBIDDEN, 403);
                return;
            }

            this.demoteUsers$(org, emails, usr).then((data) => {
                if (data) {
                    res.json(data);
                } else {
                    this.requestError(res, "error demoting user(s)", 400);
                }
            })
    


        });
    }

    promoteOrgAdmin(req: UserReq.IUserRequest, res: express.Response): void {

        let usr:JwtUser = req.user;
        const org_id = req.params.id;
        const email = req.params.email;

        let emails:string[];
        emails = [];

        if (req.body.emails != undefined) {
            emails = req.body.emails.map(email => email.toLowerCase());
        }

        if (email != undefined) {
            emails.push(email.toLowerCase())
        }

        this.getOrg$(org_id).then((org) => {

            if (!org) {
                this.requestError(res, errors.NO_SUCH_ORG);
                return;
            }

            if (!this.check(org, usr)) {
                this.requestError(res, errors.FORBIDDEN, 403);
                return;
            }

            this.promoteUsers$(org, emails, usr).then((data) => {
                if (data) {
                    res.json(data);
                } else {
                    this.requestError(res, "error creating user(s)", 400);
                }
            })
    


        });
    }

    async getUniqueUsers$(_id):Promise<Array<String>> {

        let org = await Org.findById(_id).exec();

        let ret = org.admins;

        let groups = await Group.find({org:org._id}).exec();

        for(let group of groups) {
            for(let usr of group.members) {
                if (ret.indexOf(usr) == -1) {
                    ret.push(usr);
                }
            }
        }

        return ret;
    }


    async countUsers$(_id):Promise<Number> {
        let users = await this.getUniqueUsers$(_id);
        return users.length;
    }

    userCount(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            this.countUsers$(req.params.id).then((nb) => {
                this.sendResult(res, null, {count:nb})
            }).catch((e)=> {
                this.requestError(res, e);
            });



        } catch(e) {
            this.requestError(res, e);
        }

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
                 this.requestError(res, "Forbidden : Not org admin", 403);
             }

        } catch (e)  {
            this.requestError(res, e);
        }
    }

}
export = Controller;
