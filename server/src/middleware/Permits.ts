import express = require('express');

import * as errors from '../config/messages/errors';

import permissions = require('./../config/constants/permissions')
import configAuth = require('./../config/constants/auth');
import AppFeatures = require('./../config/constants/features');
import jwt        = require('jsonwebtoken');
import UserReq = require('./UserReq');
import JwtUser = require('../app/model/interfaces/JwtUser');
import EntityModel = require('../app/model/interfaces/EntityModel');

import Org = require('../app/dataAccess/schemas/OrganizationSchema');
import Entity = require('../app/dataAccess/schemas/EntitySchema');

const mongoose = require('mongoose');

class Permits {

    constructor(private path?: string ) {
        this.checkRole = this.checkRole.bind(this);
    }


    // return a middleware
    checkRole (req: UserReq.IUserRequest, res: express.Response, next: express.NextFunction) {

        let perms: Object = permissions.perms;
        let roles: Array<string> = (req.user && req.user.roles) || [];

        let resource: string = this.path || req.route.path.split('/')[1];

        let allowed = (perms[resource] && perms[resource][req.method.toLowerCase()]) || ['*'];
        for (let a of allowed) {
            if (a == 'user') {
                if (req.user) {
                    // aok
                    next();
                    return;
                } else {
                    break;
                }
            }
            if (a == '*') {
               next();
               return;
            }
            for (let r of roles) {
                if (r == a) {
                   next();
                   return;
                }
            }
        }
        res.status(403).json({error: errors.FORBIDDEN}); // user is forbidden
    }

    static async getEntityOrgs$(entity:EntityModel):Promise<Array<any>> {
        let orgs = await Org.find({ 'entity':entity._id}).exec();
        return orgs.map(org => org._id);
    }


    static async buildUserRights$(user:JwtUser):Promise<JwtUser> {

        //  if user is admin, give all rights
        let org_ids: Array<any> = [];
        let entity_ids: Array<any> = [];
        let _id = mongoose.Types.ObjectId(user.id);

        if ((user.roles.indexOf('admin') != -1) || (user.roles.indexOf('dev') != -1) ) {
            let ents = await Entity.find({}).exec();
            entity_ids = ents.map((ent) => ent._id);

            let orgs = await Org.find({}).exec();
            org_ids = orgs.map((org) => org._id);
            user.ents = entity_ids;
            user.orgs = org_ids;

            return user;
        }


        if (user.roles.indexOf('entadmin') != -1) {
            let ents = await Entity.find({'admins': _id}).exec();
            entity_ids = ents.map((ent) => ent._id);
    
            let orgs = await Org.find({ 'entity':{$in:entity_ids}}).exec();
            org_ids = orgs.map((org) => org._id);
        }

        if (user.roles.indexOf('orgadmin') != -1) {
            let orgs = await Org.find({'admins':_id}).exec();
            let org_ids2 = orgs.map((org) => org._id);
            org_ids = org_ids.concat(org_ids2);
        }

        let ent_orgs = await Entity.find({'orgadmins':_id}).exec();
        let ent_org_ids = ent_orgs.map((ent) => ent._id);
        user.ents = entity_ids;
        user.entorgs = ent_org_ids;
        user.orgs = org_ids;

        return user;
    }

    static async verifyToken$(req: UserReq.IUserRequest) {

        let jwt_user = Permits.verifyToken(req);
        if (jwt_user && jwt_user != undefined) {
            req.user = await Permits.buildUserRights$(jwt_user);
            return req.user;
        } 
        return jwt_user;
    
    }


    static verifyToken(req: UserReq.IUserRequest) {

        // check header or url parameters or post parameters for token
        let token = req.headers['x-access-token'];
        // decode token
        if (token) {
        // verifies secret and checks exp
            const decoded = jwt.verify(token, configAuth.jwtSecret);
            let jwt_user = {
                id: decoded.sub,
                // _id :decoded.sub,
                //name: decoded.name,
                username: decoded.username, 
                roles:decoded.scope, 
                orgs:decoded.orgs,
                ents:decoded.ents,
                entorgs:decoded.ent_orgs
                //points:decoded.points
            };
            req.user = jwt_user;
            return req.user;
        }
    }


    getUser(req: UserReq.IUserRequest, res: express.Response, next: express.NextFunction) {

        // check header or url parameters or post parameters for token
        
        try {
            Permits.verifyToken$(req).then((usr) => {
                next();
            }).catch(err => {
                console.log(err);
                next();
            });
        } catch(err) {
            console.log(err);
            next();
        }

        /*
        let token = req.headers['x-access-token'];


        // decode token
        if (token) {
        // verifies secret and checks exp
            jwt.verify(token, configAuth.jwtSecret, function(err, decoded) {
                if (!err) {
                    req.user = {
                        id: decoded.sub, 
                        name: decoded.name,
                        username: decoded.username, 
                        roles:decoded.scope, 
                        orgs:decoded.orgs,
                        ents:decoded.ents,
                        missions:decoded.missions,
                        points:decoded.points
                    };
                } else {
                    console.log(err);
                }
                next();
            });
        } else {
            next();
        }
        */

    }
}

export = Permits;
