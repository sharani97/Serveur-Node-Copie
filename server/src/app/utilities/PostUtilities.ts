import JwtUser = require('../model/interfaces/JwtUser');

import Post = require('./../dataAccess/schemas/PostSchema');
import Friendship = require('./../dataAccess/schemas/FriendshipSchema');

import PostModel = require('./../model/interfaces/PostModel')

import { JobUtilities } from './JobUtilities';

import { Types } from 'mongoose';
import { CustomError }  from '../shared/customerror';

import * as errors from '../../config/messages/errors';

import { toObjectId } from '../../graphql/shared/tools';
let mongoose = require("mongoose");

let config = require('config');

let aws_conf: number = config.get('aws') 
let aws = require('aws-sdk');
aws.config.update({signatureVersion: 'v4', region:'eu-west-3'});

// endpoint: 's3-eu-central-1.amazonaws.com',
// signatureVersion: 'v4',
// region: 'eu-central-1'
let S3 = new aws.S3(aws_conf);



export class PostUtilities {

    static async create(user:JwtUser, doc:PostModel, save=true):Promise<PostModel> {

        if (doc.creator_id == undefined) {
            doc.creator_id = user.id;
        }

        let post = new Post(doc);

        if (save) {
            await post.save();
        }


        if (doc.target_ids) {
            let payload = {
                target_ids:doc.target_ids,
                target_type:doc.target_type, // always users, no ?
                subject:post._id // erm it's not sent back :/
            }

            await JobUtilities.addJob$(user, "warn.user_posted", payload);
        }

        return post;

    }

    static async getPosts(user:JwtUser, cursor = null, limit = 50):Promise<Array<PostModel>> {

        let _id = mongoose.Types.ObjectId(user.id);
        let friendships = await Friendship.find({$or:[{from:_id}, {to:_id}]}).exec();
        let friend_ids = friendships.filter(data => data.state == "ok").map(data => {
            if (data.to.toString() == user.id.toString()) {
                return data.from;
            }
            return data.to;
        });

        friend_ids.push(user.id);

        let query = {
          $or:[
              {creator_id: { $in: friend_ids}},
              { target_ids: user.id}
          ]
      }

      if (cursor) {
        try {
          let cur = toObjectId(cursor);
          query['_id'] = {$lt: cur}
        } catch(e) {
          // cursor was not a valid objectid
        }
      }

      return await Post.find(query).sort({_id: -1}).limit(limit).exec();

    }


}