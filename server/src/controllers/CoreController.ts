/**
 * Created by D. Hockley.
 */
import express = require('express');

import Constants = require('../config/constants/constants');
import JwtUser = require('../app/model/interfaces/JwtUser');

import JobModel = require ('./../app/model/JobModel');
import IJobModel = require ('./../app/model/interfaces/JobModel');
import Job = require('./../app/dataAccess/schemas/JobSchema');

import User = require('./../app/dataAccess/schemas/UserSchema');
import Points = require('./../app/dataAccess/schemas/PointsSchema');

import { UserUtilities, UserReward } from '../app/utilities/UserUtilities'

import UserPointModel = require('./../app/model/interfaces/UserPointsModel');

import { ObjectId } from 'bson';
import mongoose = require('mongoose');
// const querystring = require('querystring');
/*interface ParameterlessConstructor<T> {
    new (): T;
}*/

import * as rewards from '../config/constants/rewards'

class CoreController {



    constructor() {
        this.sendResult = this.sendResult.bind(this);
        this.requestError = this.requestError.bind(this);
        this.addJob$ = this.addJob$.bind(this);
    }

    async rewardUser$(  rewarder: JwtUser, rewardee: string, reward_id: string, 
        dom:string = null, 
        subdom:string = null):Promise<UserReward> {

        return await UserUtilities.rewardUser$(rewarder, rewardee, reward_id, dom, subdom);    
    }

    /*
    async rewardUser$(  rewarder: JwtUser, rewardee: string, type: string, 
                        amount:number = 0, 
                        dom:string = null, 
                        subdom:string = null):Promise<void> {

        return await UserUtilities.rewardUser$(rewarder, rewardee, type, amount,dom,subdom);
    }*/



    async addJob$(user: JwtUser, task: string, payload: Object, exec_at:Date = null):Promise<IJobModel> {

        if (exec_at == null) {
            exec_at = new Date();
        } 
        
        let _job = <IJobModel> {
            creator_id : user.id,
            exec_at:exec_at,
            progress: 0,
            task : task,
            state: 'new',
            payload: payload,
            output:{},
            //org: user['org'] ?user['org']:undefined
        };

        let job = new Job(_job);
        await job.save();
        return job;

    
    }


    sendResult(res: express.Response, error:any, result:any): void {

        if (error) {
            this.requestError(res, error, 400);
        } else {
            res.send(result);
        }
    }

    requestError(res: express.Response, error:any, status = 400): void {

        if (res.headersSent) {
            console.log(`headers were already sent ?!`);
            console.log(res.getHeaders());
            return;
        }
        if ((Number.isInteger(error.code)) && (error.code < 600)) {
            status = error.code;
        }

        let msg:string;
        if (error.message) {
            msg = error.message;
        } else {
            msg = error;
        }

        if (Constants.ENV == 'dev') {
            console.log(msg);
        }
        res.status(status);
        res.send({'error': msg});
    }



}
export = CoreController;