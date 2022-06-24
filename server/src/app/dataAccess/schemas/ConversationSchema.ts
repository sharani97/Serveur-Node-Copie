/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/ConversationModel');
import { Schema } from 'mongoose';

let mongooseConnection = DataAccess.mongooseConnection;

class ConversationSchema {

    static get schema () {
        let schema =  new Schema({
            title:String,
            dm: {type:Boolean, default:false},
            usr1:{type:Schema.Types.ObjectId, ref:'User', index:true}, // usr1 - which ever is lower 
            usr2:{type:Schema.Types.ObjectId, ref:'User', index:true},
            members:  [{type:Schema.Types.ObjectId, ref:'User'}], // if not dm 
            current_page:{
                type:Number, 
                required:true,
                default:0
            },
            read:Schema.Types.Mixed
        },
        { 
            timestamps: { 
                createdAt: 'created', 
                updatedAt: 'updated' 
            }
        });

        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('Conversation', ConversationSchema.schema);
export = schema;''
