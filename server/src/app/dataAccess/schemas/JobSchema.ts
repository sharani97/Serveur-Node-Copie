/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/JobModel');
import { Schema } from 'mongoose';

let mongooseConnection = DataAccess.mongooseConnection;

class JobSchema {
    static get schema () {
        let schema =  new Schema({
            id: String, // = id
            exec_at:{    
                    type: Date,
                    default: () => +new Date
            },
            creator_id: Schema.Types.ObjectId,
            task: String, // generate YT reports, etc.
            progress: Number,
            state:{
                type: String, // enum, : new, failed, error, started, cancelled, done, finished_ok...
                default: 'new'
            },
            payload: Schema.Types.Mixed,
            output: Schema.Types.Mixed
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });

        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('Job', JobSchema.schema);
export = schema;''

