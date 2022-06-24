import { ResolverMap } from '../../types/graphql';
import { toGraph, toObjectId } from '../shared/tools';
import Friends = require('../../app/dataAccess/schemas/FriendshipSchema')

import User = require ('../../app/dataAccess/schemas/UserSchema');
import Points = require('../../app/dataAccess/schemas/PointsSchema');


export const resolvers: ResolverMap = {
    Query: {
      test_me: () => {
        return {
          username: 'Robin Wieruch',
        };
      },

      async users( obj, args, context:any, info) {
        let _users = await User.find({}).lean().exec();
        return toGraph(_users);
      },
      async user( obj, _id, context:any, info) { // not sure about _id in args, could be { }
          let _user = await User.findById(_id).lean().exec();
          return toGraph(_user);
      }
    },

    User: {

      async friends( obj, args, context:any, info)  {
        if (obj._id) {
            return toGraph(await Friends.find({'$or':[
                {'to':toObjectId(obj._id)},
                {'from':toObjectId(obj._id)}
        ]}).lean().exec());
        }
        return null
      },

      async points( obj, args, context:any, info) {
        let _points = await Points.find({'primary':true, 'user': toObjectId(obj._id)}).lean().exec();
        return toGraph(_points);
      }



    }
}