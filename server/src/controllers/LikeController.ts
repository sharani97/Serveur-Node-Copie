/**
 * Created by D. Hockley.
 */
import express = require('express');
import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');
import JwtUser = require('../app/model/interfaces/JwtUser');


import * as errors from '../config/messages/errors';
import * as jobtypes from '../config/constants/jobtypes';

import Business = require('./../app/business/LikeBusiness');
import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/LikeModel');

import { UserUtilities } from './../app/utilities/UserUtilities';
import { LikeUtilities } from '../app/utilities/LikeUtilities';

import rewards = require('./../config/constants/rewards')
import Like = require('./../app/dataAccess/schemas/LikeSchema');

import Comment = require('./../app/dataAccess/schemas/CommentSchema');

import UserReq = require('../middleware/UserReq');

class Controller extends BaseController<IModel, Business> {

    constructor(protected ctor: ParameterlessConstructor<Business>) {
        super(ctor);
    }


    // await UserUtilities.rewardUser$(user, user.id, rewards.VOTE, dom, subdom );

    async like$(doc:IModel, user:JwtUser):Promise<IModel> {

        let { like, reward } = await LikeUtilities.like$(doc, user);
        return like;
    }

    create(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            let doc = <IModel>req.body;

            let user_id:string; 

            if (doc.target_type == undefined) {
                this.requestError(res, errors.MISSING_PARAMETER.concat("target_type"));
                return; 
            }

            if (doc.user_id == undefined) {
                doc.user_id = user.id;
            }

            this.like$(doc, user).then( (like) => {
                this.sendResult(res, null, like);
            }).catch((error) => {
                this.requestError(res,error);
            });

        } catch (e)  {
            this.requestError(res, e);
        }
    }


}
export = Controller;