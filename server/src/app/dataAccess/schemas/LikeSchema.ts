/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/LikeModel');
import { Schema } from 'mongoose';

let mongooseConnection = DataAccess.mongooseConnection;
/*
    voter_id: string;
    idea_id: string;
    vote_nb: number;
    */
class LikeSchema {
    static get schema () {
        let schema =  new Schema({
            user_id: Schema.Types.ObjectId,
            target_id: Schema.Types.ObjectId,
            target_type: {
                type:String,
                default:"idea",
                emum:["idea", "comment", "mission", "user", "post", "notif"]
            },
            meaning: {
                type:String,
                default:"like",
                emum:["flag", "like","vote", "karma"]
            },
            nb: {
                type:Number,
                default: 0 // can be negative
            },
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });

        schema.index({ user_id: 1, target_id: 1, meaning:1}, { unique: true });

        schema.post('save', function(error, doc, next) {
            if (error.name === 'MongoError' && error.code === 11000) {
                next(new Error("You can't like twice"));
                return;
            } else {
                next(error);
            }
        });

        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('Like', LikeSchema.schema);
export = schema;''

