import JwtUser = require('../model/interfaces/JwtUser');
import User = require('./../dataAccess/schemas/UserSchema');
import Job = require('./../dataAccess/schemas/JobSchema');
import Points = require('./../dataAccess/schemas/PointsSchema');
import * as rewards from '../../config/constants/rewards'


import UserModel = require('./../model/interfaces/UserModel');
import JobModel = require('./../model/interfaces/JobModel');
import mongoose = require('mongoose');
import { CustomError }  from '../shared/customerror';
import settings = require('./../../config/constants/globals');
import * as errors from '../../config/messages/errors';
let moniker = require('moniker');
let config = require("config")

const fields = ['gp', 'kp','ap', 'ip']

export interface UserReward {
    [key:string]: number;
}

export function emptyReward():UserReward {

    let rwd = <UserReward> {};
    for(let field of fields) {
        rwd[field] = 0;
    }
    return rwd;
}


export function addRewards(rwd1:UserReward, rwd2:UserReward):UserReward {

    let rwd = emptyReward();

    for(let field of fields) {
        rwd[field] = (rwd1[field] || 0) + (rwd2[field] || 0);
    }

    return rwd;
}


/*
export interface VoteReward {
    reward: UserReward,

}*/
import idify = require('../dataAccess/schemas/makeId');
import { FilterQuery } from 'mongoose';

export class UserUtilities {

    static nameGen;


    static async checkAvailability(_param: string, _value: string): Promise<boolean> {
        if (_param != "email" && _param != "username") {
            return true;
        }

        if (_param == "email") {
            _value = _value.toLowerCase();
        } else {
            _param = "id";
            _value = idify.idify(_value);
        }

        let user = await User.findOne({ [_param] : _value}).exec();

        if (user && user.status != 'pending') {
            return false;
        } else {
            return true;
        }
    }


    static async findUsers(txt: String):Promise<Array<UserModel>> {

      let _query = { "$or": [
        { "name": { "$regex": txt}}, 
        { "username": { "$regex": txt}}, 
        { "first_name": { "$regex": txt}}, 
        { "email": { "$regex": txt}}, 
      ]};

      return await User.find(_query).exec();
    }


    static async findUsersFullName(txt: String):Promise<Array<UserModel>> {

      console.log('searching for ', txt);
      let _query = {$text : {$search: txt}} as FilterQuery<UserModel>;
      let _s = { score : { $meta: 'textScore' }};
        //@ts-ignore
      let ret = await User.find(_query, _s).sort(_s).exec();
      console.log('result : ', ret);
      return ret;
    }

    static async coreRwdUser$(  rewarder: JwtUser, rewardee: string, type: string,
        amount:number = 0,
        dom:string = null,
        subdom:string = null):Promise<void> {
        //let dom_id = mongoose.Types.ObjectId(dom);
        //let subdom_id = mongoose.Types.ObjectId(subdom);
        let rewardee_id = new mongoose.Types.ObjectId(rewardee)

        for(let d of [dom, subdom]) {
            if (d) {
                let id = new mongoose.Types.ObjectId(d);
                await Points.update({user:rewardee_id, cat:type, dom:d},
                    {
                        $inc: {amount: amount},
                        $setOnInsert: {user:rewardee_id, cat:type, dom:d}
                    },
                    { upsert: true }
                );
            }
        }

        await Points.update({user:rewardee_id, cat:type, dom:{$exists:false}}, {
        $inc: {amount: amount},
        $setOnInsert: {user:rewardee_id, cat:type }
        }, {upsert: true});
    }

    static async rewardUser$(  rewarder: JwtUser, rewardee: string, reward_id: string,
        dom:string = null,
        subdom:string = null):Promise<UserReward> {

        let _rwd:UserReward = {};

        let _rewards = config.get('rewards');
        let _reward = _rewards[reward_id];
        for (let cat in _reward) {
            let amount = _reward[cat];
            _rwd[cat] = amount;
            await UserUtilities.coreRwdUser$(rewarder, rewardee, cat, amount, dom, subdom);
        }
        return _rwd;
    }




    static async getUserBadges(user:JwtUser):Promise<UserModel> {
        return
    }



    static async getOrcreateUser(user:JwtUser, email:string, roles=['user']):Promise<UserModel> {

        let root = 'user';
        email = email.toLowerCase();

        if (settings.funMode) {
            if (!UserUtilities.nameGen) {
                UserUtilities.nameGen = moniker.generator([moniker.adjective, moniker.noun], {
                    glue: '_'
                });
            }
            root = this.nameGen.choose();
        }


        let usr = await User.findOne({email:email}).exec();
        if (usr) {
            let dirty = false;
            for(let role of roles) {
                if (usr.roles.indexOf(role) == -1) {
                    usr.roles.push(role);
                    dirty = true;
                }
            }
            if (dirty) await usr.save();
            return usr;
        }

        let id = await User.count({}).exec() +1;
        let usrData = {
            email: email,
            username:`${root}_${id}`,
            roles: roles,
            status: 'pending',
        };

        let newUser  = new User(usrData);
        return await newUser.save();
    }
}