/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/FileModel');
import { Schema } from 'mongoose';

let mongooseConnection = DataAccess.mongooseConnection;

class FileSchema {
    static get schema () {
        let schema =  new Schema({
            creator_id: Schema.Types.ObjectId,
            ext: String, // extension, 3 letters 
            filetype:{
                type:String,
                enum:['image', 'report', 'cover'],
                default: 'image'
            },
            url: String, //client side view  :/ => needs calculating ? + key

            // add data for GED
            key:String,         // file path
            date:String,        // as YYYYMMDD
            bucket:String,      // id or name ?
            status:{
              type:String,
              enum:['pending','unprocessed','ok','cancelled', null],
            },
            target_id:Schema.Types.ObjectId,
            target_type:{
                type:String,
                enum:['entity','mission','idea','organization', 'user', 'post', null],
            }
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });

        schema.index({ target_id: 1, filetype: 1, date:1});

        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('File', FileSchema.schema);
export = schema;''

