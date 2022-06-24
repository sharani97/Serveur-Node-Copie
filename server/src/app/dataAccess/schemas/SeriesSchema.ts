/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/SeriesModel');
import { Schema } from 'mongoose';
import idify = require('./makeId');

const mongooseConnection = DataAccess.mongooseConnection;

class SeriesSchema {

    static get schema () {
        const schema =  new Schema({
            title:   {type: String, required: true, text: true},
            description:   {type: String, text: true},
            id: {type: String, unique : true, required:true, lowercase:true },
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });




        return schema;
    }
}
const schema = mongooseConnection.model<IModel>('Series', SeriesSchema.schema);
export = schema; ''

