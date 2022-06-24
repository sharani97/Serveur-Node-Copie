import { ResolverMap } from '../../types/graphql';
import { toGraph, toObjectId } from '../shared/tools';
import Friends = require('../../app/dataAccess/schemas/FriendshipSchema')

import Org = require ('../../app/dataAccess/schemas/OrganizationSchema');
import Entity = require ('../../app/dataAccess/schemas/EntitySchema');
import Group = require ('../../app/dataAccess/schemas/GroupSchema');

import Points = require('../../app/dataAccess/schemas/PointsSchema');


export const resolvers: ResolverMap = {
    Query: {
      async orgs( obj, args, context:any, info) {
        let _orgs = await Org.find({}).lean().exec();
        return toGraph(_orgs);
      },
      async org( obj, _id, context:any, info) { // not sure about _id in args, could be { }
          let _org = await Org.findById(_id).lean().exec();
          return toGraph(_org);
      }
    }
}