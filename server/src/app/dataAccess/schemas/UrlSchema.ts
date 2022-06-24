/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/UrlModel');
import { Schema } from 'mongoose';

let mongooseConnection = DataAccess.mongooseConnection;

class UrlSchema {

    static get schema () {
        let schema =  new Schema({
            link: {type: String, required: true, unique : true},
            image: {type: String},
            title: String,
            desc: String,
            img_width:Number,
            img_height:Number,
            img_type: String
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });

        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('Url', UrlSchema.schema);
export = schema; ''
