/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/CommentModel');
import { Schema } from 'mongoose';
import { UrlFragment } from './UrlFragment';

let mongooseConnection = DataAccess.mongooseConnection;

class CommentSchema {
    static get schema () {
        let schema =  new Schema({
            creator_id: Schema.Types.ObjectId,
            suggest:{
                type:Boolean,
                default:false,
            },
            target_id: Schema.Types.ObjectId,
            image: Schema.Types.ObjectId,
            image_url: String,
            target_type: {
                type:String,
                default:"entity",
                emum:["entity", "organization", "mission", "idea", "comment"]
            },
            title:{
                type: String
            },
            description: String,
            url:Schema.Types.ObjectId,
            urldata: UrlFragment
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });

        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('Comment', CommentSchema.schema);
export = schema;''

