import { ResolverMap } from '../../types/graphql';
import { toGraph, toObjectId } from '../shared/tools';
import { UserContext } from '../shared/types';

import bcrypt     = require('bcrypt');

import User = require('../../app/dataAccess/schemas/UserSchema');


import mongoose = require('mongoose');
// import { IDEA_SUGGESTION, PHASE1_PASSED } from '../../config/constants/rewards';


export const resolvers: ResolverMap = {

    Query: {


    },
    Mutation : {
        async adminResetUserPassword(parent, {email, password}, context:UserContext, info) {

            if ((context.user.roles.indexOf('admin') > -1) || 
                (context.user.roles.indexOf('dev') > -1)) {
                // 1. find user 
                const user = await User.findOne({email}).exec();
                if (user) {
                    user.token = await bcrypt.hash(password, 3);
                    await user.save;
                    return true;
                }
                return false;
            }
        }
    }
}