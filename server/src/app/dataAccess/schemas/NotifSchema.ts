/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/NotifModel');
import { Schema } from 'mongoose';

let mongooseConnection = DataAccess.mongooseConnection;

class NotifSchema {
    static get schema () {
        let schema =  new Schema({

            date: Date, // can be future date, i.e. not the same as 'created'
            org: Schema.Types.ObjectId,
            creator_id: Schema.Types.ObjectId,
            type: String,   // milestone delayed, etc.
            state: String,  // ?? what is this supposed to be ??
            text:String,    // OR: localize in client ??
            nb: Number,  // x and 8 others.
            uri:String,
            rooturi:String,
            read:{ type:Boolean, default:false },
            payload: Schema.Types.Mixed,
            target: {type: Schema.Types.ObjectId, ref:'User', index:true},
            subject: { type:Schema.Types.ObjectId, index:true },// which is the concerned item ?
            res: {
                type:String,
                emum:["mission", "idea", "post", "organization", "entity", "comment"]  // a suggestion is a comment 
            }
        },
        {
            timestamps: { createdAt: 'created',  updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });

        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('Notif', NotifSchema.schema);
export = schema;''

