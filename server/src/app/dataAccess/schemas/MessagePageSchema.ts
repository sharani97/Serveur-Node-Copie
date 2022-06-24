/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/MessagePageModel');
import { Schema } from 'mongoose';
import { UrlFragment } from './UrlFragment';

let mongooseConnection = DataAccess.mongooseConnection;

class MessagePageSchema {

    static get schema () {
        let schema =  new Schema({
            conversation:{
                type:Schema.Types.ObjectId,
                required:true,
                ref: 'Conversation'
            },
            nb:{
                type:Number,
                required:true
            },
            open:{
                type:Boolean,
                required:true,
                default:true
            },
            // avoid concurrent edits :
            // http://www.mattpalmerlee.com/2014/03/22/a-pattern-for-handling-concurrent/
            // https://stackoverflow.com/questions/27584564/concurrent-editing-with-nonce-in-mongodb
            /*nonce:{
                type:.Schema.Types.ObjectId, //
                required: true,
                default: Types.ObjectId
            },*/

            prev:{
                type:Schema.Types.ObjectId,
                ref: 'MessagePage'
            },
            next:{
                type:Schema.Types.ObjectId,
                ref: 'MessagePage'
            },
            read:Schema.Types.Mixed,
            messages:  [
                {
                    from:Schema.Types.ObjectId,
                    msg:String, 
                    //ts:Date, will be in _id 
                    url:Schema.Types.ObjectId,
                    urldata: UrlFragment
                }],
        },
        { timestamps: { createdAt: 'created', updatedAt: 'updated' }}
        );

        schema.index({conversation: 1, nb: -1}, {unique: true});

        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('MessagePage', MessagePageSchema.schema);
export = schema;''
