/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import express = require('express');
import Business = require('./../app/business/GroupBusiness');
import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/GroupModel');
import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');
import settings = require('./../config/constants/globals');

import * as errors from '../config/messages/errors';

import User = require('./../app/dataAccess/schemas/UserSchema');

import * as jobtypes from './../config/constants/jobtypes';
import Job = require('./../app/dataAccess/schemas/JobSchema');

import Org = require('./../app/dataAccess/schemas/OrganizationSchema');

import Group = require('./../app/dataAccess/schemas/GroupSchema');


import JwtUser = require('../app/model/interfaces/JwtUser');
import UserModel = require('./../app/model/interfaces/UserModel');

import { UserUtilities } from '../app/utilities/UserUtilities';

import { CustomError } from '../app/shared/customerror';
import { Mongoose } from 'mongoose';
import UserReq = require('../middleware/UserReq');
let moniker = require('moniker');
let mongoose = require('mongoose');

class Controller extends BaseController<IModel, Business> {

    nameGen:any;

    constructor(protected ctor: ParameterlessConstructor<Business>) {
        super(ctor);

        this.check     = this.check.bind(this);
        this.create     = this.create.bind(this);
        this.inviteUsers = this.inviteUsers.bind(this);
        this.removeUsers = this.removeUsers.bind(this);
        this.getMembers = this.getMembers.bind(this);


        if (settings.funMode) {
            this.nameGen = moniker.generator([moniker.adjective, moniker.noun], {
            glue: '_'
          });
        }

    }

    check(doc:IModel, user:JwtUser) {
        if (user.roles.indexOf('admin') != -1) { // admin users have free reign
            return true;
        }

        if (doc.org == undefined) {
            return false;
        }

        //if (user.roles.indexOf('orgadmin') != -1) { // orgadmin users need to be orgadmins of their org
        //return (user.orgs.indexOf(doc.org.toString())!= -1);
        for (let _id of user.orgs) {
            if (_id.toString() ==  doc.org.toString()) {
                return true
            }
        }
    
        //}
    }

    async inviteOneUser(group:IModel, email:string, inviter:JwtUser):Promise<UserModel> {
        return await UserUtilities.getOrcreateUser(inviter, email, ['user']);
    }

    async inviteUsers$(group:IModel, emails:Array<string>, inviter:JwtUser):Promise<IModel> {

        let org = await Org.findById(group.org).exec();

        if (group.members == undefined) {
            group.members = [] as string[];
        }
        let users: UserModel[] = [];

        for (let email of emails) {
            let user = await UserUtilities.getOrcreateUser(inviter, email, ['user']);
            users.push(user);
        }

        for (let user of users) {
            if (group.members.indexOf(user._id) == -1) {
                group.members.push(user._id);
            }
            if (org.members.indexOf(user._id) == -1) {
                org.members.push(user._id);
            }
        }

        if ((org.max_user_nb > 0) && (org.members.length > org.max_user_nb)) {
            throw new CustomError(errors.TOO_MANY_USERS, 403);
        }

        await org.save();
        await group.save();
        return group;

    }

    async getUsers$(_id:string):Promise<Array<UserModel>> {

        try {
            let group = await Group.findById(_id).exec();
            let member_ids = group.members.map((id) => mongoose.Types.ObjectId(id));
            let users = await User.find({_id:{$in: member_ids}}).exec();
            return users;

        } catch (err) {
            throw new Error(err);
        }
    }

    getMembers (req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let _id = req.params._id;
            this.getUsers$(_id).then((users) => {
                this.sendResult(res, null, users);
            });
        } catch(err) {
            this.requestError(res, err);
        }

    }

    async removeUsers$(user:JwtUser, group_id:string, emails:Array<string>):Promise<IModel> {

        let group = await Group.findById(group_id);

        if (this.check(group, user) == false) {
            throw new Error(errors.FORBIDDEN);
        }

        let users = await User.find({"email":{$in:emails}});

        for(let user of users) {
            let index = group.members.indexOf(user._id);
            if (index != -1) {
                group.members.splice(index,1);
            }
        }

        await group.save()

        return group;
    }

    removeUsers(req:UserReq.IUserRequest, res:express.Response): void {

        try {
            let _id = req.params._id;
            let emails:string[];
            emails = [];

            if (req.body.emails) {
                emails = req.body.emails;
            }

            let email = req.params.email;
            if (email != undefined) {
                emails.push(email.toLowerCase())
            }

            emails = emails.map((email)=> email.toLowerCase());

            this.removeUsers$(req.user, _id, emails).then((group) => {
                this.sendResult(res, null, group);
            }).catch(e => {
                this.requestError(res, e);
            })
        } catch (err) {
            this.requestError(res, err);
        }
    
    }

    inviteUsers(req: UserReq.IUserRequest, res: express.Response): void {
        // get group from id

        try {

            let _id = req.params._id;

            // check user is group orgadmin of full admin
            // get emails
            // call function

            let emails:string[];
            emails = [];

            if (req.body.invitees) {
                emails = req.body.invitees;
            }

            let email = req.params.email;
            if (email != undefined) {
                emails.push(email.toLowerCase())
            }

            Group.findById(_id).then( group => {
                if (this.check(group, req.user)) {
                    this.inviteUsers$(group, emails, req.user).then((grp) => {
                        this.sendResult(res, null, grp);
                    }).catch((err) => {
                        console.log(err);
                        this.requestError(res, err);
                    });
                } else {
                    this.requestError(res, errors.FORBIDDEN, 403);
                }
            });

        } catch(err) {
            this.requestError(res, err);
        }
    }

    create(req: UserReq.IUserRequest, res: express.Response): void {

        try {
            let user = req.user;
            let doc = <IModel>req.body;

            // do we get
            if (doc.name == undefined) {
                this.requestError(res, errors.MISSING_PARAMETER.concat('name'));
                return;
            }

            if (!doc.org.match(/^[0-9a-fA-F]{24}$/)) {
                this.requestError(res, `Incorrect org id for group : ${doc.org}`, 403);
                return;
            }

            let emails:string[];
            emails = [];

            if (req.body.invitees) {
                emails = req.body.invitees;
            }

            if (!this.check(doc, user)) {
                this.requestError(res, errors.FORBIDDEN, 403);
                return;
            }

            Group.find({org: mongoose.Types.ObjectId(doc.org), name:doc.name}).then((group) => {
                if (group.length > 0) {
                    this.requestError(res, errors.GROUPS_EXISTS_IN_ORG);
                } else {
                    this.getNew().create(<IModel>req.body, (error: Error, result) => {
                        if (error) {
                            this.requestError(res, error);
                            return;
                        }
                        this.inviteUsers$(result, emails, user).then((group) => {
                            this.sendResult(res, error, group);
                            return;
                        });
                    });        
                }
            }).catch((e) => {
                this.requestError(res, e);
            });
             
        } catch (e)  {
            this.requestError(res, e);
        }
    }


}
export = Controller;
