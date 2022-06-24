/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/FriendshipModel');
import { Schema } from 'mongoose';

let mongooseConnection = DataAccess.mongooseConnection;

class FriendshipSchema {
    static get schema () {
        let schema =  new Schema({
            from: { type:Schema.Types.ObjectId, ref:'User', index:true},
            to:{ type:Schema.Types.ObjectId, ref:'User', index:true}, // i.e. the thing being bought 
            state: {
                type:String,
                enum:['ok','req','ko']
            }
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });

        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('Friendship', FriendshipSchema.schema);
export = schema;''

