/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/SystemEventModel');
import { Schema } from 'mongoose';

let mongooseConnection = DataAccess.mongooseConnection;
/*
type: string
    creator_id: string,
    target: string, 
    target_type:string,
    payload: [{
        key: string,
        value: string
    }]
*/
class SystemEventSchema {
    static get schema () {
        let schema =  new Schema({
            id: String, // = id
            date:Date,
            organization:String,
            creator_id: String,
            type: String, // event name
            target: String, // impacted object
            target_type:String, // so we know how to get it
            payload: Schema.Types.Mixed
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });

        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('SystemEvent', SystemEventSchema.schema);
export = schema;''

