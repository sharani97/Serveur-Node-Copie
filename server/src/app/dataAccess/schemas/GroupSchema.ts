/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/GroupModel');
import { Schema } from 'mongoose';

const mongooseConnection = DataAccess.mongooseConnection;

class GroupSchema {


    static get schema () {
        const schema =  new Schema({

            /*
                name:   string;
                id: string;
                org: string; 
                members:[string];
            */

            name:   {type: String, required: true},
            description:   {type: String},
            org: {type: Schema.Types.ObjectId, required: true, index:true},
            members: [Schema.Types.ObjectId],
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });



        return schema;
    }
}
const schema = mongooseConnection.model<IModel>('Group', GroupSchema.schema);
export = schema; ''

