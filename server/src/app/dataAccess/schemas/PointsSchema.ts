/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/PointsModel');
import { Schema } from 'mongoose';

let mongooseConnection = DataAccess.mongooseConnection;

class PointsSchema {

    static get schema () {
        let schema =  new Schema({
            user:   { type:Schema.Types.ObjectId, ref:'User', required:true},
            dom: { type:Schema.Types.ObjectId, index:true },
            amount:{type:Number, required:true},
            primary:Boolean,
            cat:{
                type: String, 
                default: 'xp', 
                required:true
            },
        });
        schema.index( {user: 1, cat: 1, dom: 1}, {unique: true});
        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('Points', PointsSchema.schema);
export = schema;''
