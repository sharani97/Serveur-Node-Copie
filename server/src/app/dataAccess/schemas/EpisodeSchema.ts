/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/EpisodeModel');
import { Schema } from 'mongoose';
import idify = require('./makeId');

const mongooseConnection = DataAccess.mongooseConnection;

class EpisodeSchema {

    static get schema () {
        const schema =  new Schema({
            title:   {type: String, required: true, text: true},
            description: String,
            id: {type: String, lowercase:true },
            url: String,
            nb: Number,
            season: String,
            series_id: { type:Schema.Types.ObjectId, ref:'Series'}
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });

        return schema;
    }
}
const schema = mongooseConnection.model<IModel>('Episodes', EpisodeSchema.schema);
export = schema; ''

