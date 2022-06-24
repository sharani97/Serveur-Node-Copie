/**
 * Created by D. Hockley.
 */
import express = require('express');
import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');
import JwtUser = require('../app/model/interfaces/JwtUser');


import * as errors from '../config/messages/errors';
import * as jobtypes from '../config/constants/jobtypes';

import Business = require('./../app/business/PostBusiness');
import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/PostModel');
import Post = require('./../app/dataAccess/schemas/PostSchema');
import Comment = require('./../app/dataAccess/schemas/CommentSchema');
import Like = require('./../app/dataAccess/schemas/LikeSchema');
import { PostUtilities } from './../app/utilities/PostUtilities';
import UserReq = require('../middleware/UserReq');

import mongoose = require('mongoose');
import PostModel = require('../app/model/PostModel');

class Controller extends BaseController<IModel, Business> {

    constructor(protected ctor: ParameterlessConstructor<Business>) {
        super(ctor);
        this.details = this.details.bind(this);
    }

    create(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            let doc = <IModel>req.body;

            PostUtilities.create(user, doc).then((ret) => {
                this.sendResult(res, null, ret);
            }).catch((err) => {
                this.requestError(res,err);
            });
        } catch (e)  {
            this.requestError(res, e);
        }
    }


    async details$(id:string) {

        let _id = new mongoose.Types.ObjectId(id);

        let comments = await Comment.find({target_id : _id}).exec();
        let likes = await Like.find({target_id : _id}).exec();

        return {
            comments: comments,
            suggestions:[], // backwards compat issues
            likes:likes
        };

    }

    details(req: UserReq.IUserRequest, res: express.Response): void {

        try {
            let user = req.user;
            //doc.creator_id = user.id;
            let target_id = req.params._id;
            this.details$(target_id).then(data => {
                this.sendResult(res, null, data);
            }).catch((e) => {
            this.requestError(res, e);
            });
        } catch(e) {
            this.requestError(res, e);
        }
    }

}
export = Controller;