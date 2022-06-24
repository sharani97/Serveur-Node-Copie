/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/StatsLineModel');
import { Schema } from 'mongoose';

let mongooseConnection = DataAccess.mongooseConnection;

class StatsLineSchema {
    static get schema () {
        let schema =  new Schema({
            target_type: String, // enum mission, idea, .. ?
            target_id:Schema.Types.ObjectId, // i.e. the thing being bought 
            date: String, // YYYYMMDD 
            data: Schema.Types.Mixed
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });

        schema.index({ target_id: 1, data: 1}, { unique: true });

        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('StatsLine', StatsLineSchema.schema);
export = schema;''

