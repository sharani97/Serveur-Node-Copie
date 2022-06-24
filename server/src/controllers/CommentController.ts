/**
 * Created by D. Hockley.
 */

import express = require('express');
import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');
import JwtUser = require('../app/model/interfaces/JwtUser');

import * as errors from '../config/messages/errors';
import * as jobtypes from '../config/constants/jobtypes';

import Business = require('./../app/business/CommentBusiness');
import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/CommentModel');

import Comment = require('./../app/dataAccess/schemas/CommentSchema');
import Like = require('./../app/dataAccess/schemas/LikeSchema');

import UserReq = require('../middleware/UserReq');

import mongoose = require('mongoose');


class Controller extends BaseController<IModel, Business> {


    constructor(protected ctor: ParameterlessConstructor<Business>) {
        super(ctor);
        this.details = this.details.bind(this);
    }


    create(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = <JwtUser>req.user;
            let doc = <IModel>req.body;

            if (doc.target_type == undefined) {
                this.requestError(res, errors.MISSING_PARAMETER.concat("target_type"));
                return; 
            }

            if (doc.title == undefined) {
                this.requestError(res, errors.MISSING_PARAMETER.concat("title"));
                return; 
            }

            if (doc.creator_id == undefined) {
                doc.creator_id = user.id;
            }

            this.getNew().create(doc, (error: Error, result) => {
                if (error) {
                    this.requestError(res,error);
                    return;
                }

                this.addJob$(user, jobtypes.WARN_USER_COMMENTED, {
                    user_id:user.id, 
                    target_id:doc.target_id, 
                    target_type:doc.target_type,
                    title: doc.title,
                    suggest:doc.suggest,
                    comment_id: doc._id
                }).then((ok) => {
                    this.sendResult(res, error, result);
                }).catch((err) => {
                    this.requestError(res,error);
                });  
            });
        } catch (e)  {
            this.requestError(res, e);
        }
    }

    async details$(id:string) {

        let _id = new mongoose.Types.ObjectId(id);

        let suggestions = await Comment.find({target_id : _id}).exec();
        let likes = await Like.find({target_id : _id}).exec();

        return {
            suggestions: suggestions,
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