import JwtUser = require('../model/interfaces/JwtUser');

import Notif = require('./../dataAccess/schemas/NotifSchema');


import mongoose = require('mongoose');
import { CustomError }  from '../shared/customerror';

import * as notifs from '../../config/constants/notiftypes';
import * as errors from '../../config/messages/errors';
import { ObjectID } from 'bson';

import JobModel = require ('./../model/JobModel');
import IJobModel = require ('./../model/interfaces/JobModel');
import Job = require('./../dataAccess/schemas/JobSchema');

export class JobUtilities {

    static async addJob$(user: JwtUser, task: string, payload: Object, exec_at:Date = null):Promise<IJobModel> {

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
}