import JwtUser = require('../model/interfaces/JwtUser');

import Like = require('./../dataAccess/schemas/LikeSchema');
import Comment = require('./../dataAccess/schemas/CommentSchema');

import * as jobtypes from '../../config/constants/jobtypes';

import User = require('./../dataAccess/schemas/UserSchema');

import Points = require('./../dataAccess/schemas/PointsSchema');
import PointsModel = require('./../model/interfaces/PointsModel');
import * as rewards from '../../config/constants/rewards';

import mongoose = require('mongoose');
import { CustomError }  from '../shared/customerror';

import { UserUtilities, UserReward, emptyReward, addRewards } from './UserUtilities';
import LikeModel = require('./../model/interfaces/LikeModel');
import { JobUtilities } from './JobUtilities';



interface LikeReward {
    like:LikeModel,
    reward:UserReward
}

export class LikeUtilities {

    static async like$(doc:LikeModel, user:JwtUser):Promise<LikeReward> {

        let like = new Like(doc);
        let reward = emptyReward();

        if (like.nb != 0) {

            if (doc.target_type == 'post') {
                let _rwd = await UserUtilities.rewardUser$(user, user.id, rewards.LIKE_POST);
                reward = addRewards(reward, _rwd);
            }

            await JobUtilities.addJob$(user, jobtypes.WARN_USER_LIKED, {
                user_id:doc.user_id,            // creator of like
                target_id:doc.target_id,        // target is object not just user
                target_type:doc.target_type,    // sender
                meaning:doc.meaning,            // like, karma, etc. 
                like_id:like._id,
                nb:doc.nb
            });
        }

        await like.save();
        return { like, reward };
    }

}