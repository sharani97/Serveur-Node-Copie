/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/PostModel');
import { Schema } from 'mongoose';
import { UrlFragment } from './UrlFragment';

let mongooseConnection = DataAccess.mongooseConnection;

class PostSchema {
    static get schema () {
        let schema =  new Schema({
            creator_id: Schema.Types.ObjectId,
            /*suggest:{
                type:Boolean,
                default:false,
            },*/ // ?
            //target_id: Schema.Types.ObjectId, ??
            target_ids:[Schema.Types.ObjectId], // to whom this is sent, in fine
            target_type: {
                type:String,
                default:"none",
                emum:["entity", "organization", "mission", "idea", "comment", "user", "none"]
            },
            image:Schema.Types.ObjectId, // is the url enough ?? at least it keeps compat
            image_url: String, 
            mission_id:Schema.Types.ObjectId, // for when it gets transformed I guess
            state:{
                type:String,
                default:"new",
                emum:["new", "cancelled", "selected", "expired"]
            },
            title:{
                type: String,
                required:true
            }, 
            description: String,
            url:Schema.Types.ObjectId,
            urldata: UrlFragment,
            link: String
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });

        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('Post', PostSchema.schema);
export = schema;''

