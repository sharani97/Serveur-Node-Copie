import Job = require('./../dataAccess/schemas/JobSchema');
import Friendship = require('./../dataAccess/schemas/FriendshipSchema');

import * as rewards from '../../config/constants/rewards';
import * as friend_jobtypes from '../../config/constants/friend_jobtypes';


import FriendshipModel = require('./../model/interfaces/FriendshipModel');


import mongoose = require('mongoose');
import { JobUtilities } from './JobUtilities';
import JwtUser = require('../model/interfaces/JwtUser');

export class FriendUtilities {

    static async addFriend$(user:JwtUser, other:string):Promise<FriendshipModel> {

        let me = user.id;
        let me_id = new mongoose.Types.ObjectId(me);
        let other_id = new mongoose.Types.ObjectId(other);
        
        let friend = await Friendship.findOne({$or:[{from:me_id, to:other_id}, {from:other_id, to:me_id}]}).exec();

        let dirty = false;
        let job = null;

        if (friend == null) {
            friend = new Friendship({
                from: me,
                to:other,
                state:"req"
            });
            dirty = true;
            job = friend_jobtypes.NEW_FRIENDSHIP_REQUETS;

        } else {

            if (friend.state != "ok") {
                if (friend.state == "ko")  {
                    // new request cancels old ?
                    friend.from = me;
                    friend.to = other;
                    friend.state = "req";
                    dirty = true;
                    job = friend_jobtypes.NEW_FRIENDSHIP_REQUETS;
                }

                if (friend.state == "req") {
                    // check if accepting
                    if (friend.to == me) {
                        friend.state = "ok";
                        dirty = true;
                        job = friend_jobtypes.FRIENDSHIP_ACCEPTED;
                    }
                }
            }
        }

        if (!dirty) {
            return friend;
        }

        await friend.save();
        await JobUtilities.addJob$(user, job, {from:user.id, to:other_id});
        return friend;
    }


}