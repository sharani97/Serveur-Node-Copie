/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/ActionModel');
import { Schema } from 'mongoose';

let mongooseConnection = DataAccess.mongooseConnection;

class ActionSchema {
    /*
    id:   string;
    date:   Date;
    email:  string;
    state:  string;
    type:  string;
    company_id: string;
    properties: string[]
    action: string;
    */

    static protect = [];

    static get schema () {
        let schema =  new Schema({
            id: {type: String, required: true, unique : true},
            date: {type: Date},
            organization: String,
            email: String,
            state: String,
            type: String,
            properties: [String],
            company_id: String,
            action:String
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });

        schema.virtual('person', {
            ref: 'Contact', // The model to use
            localField: 'email', // Find companies where `localField`
            foreignField: 'email' // is equal to `foreignField`
        });

        schema.virtual('company', {
            ref: 'Company', // The model to use
            localField: 'id', // Find companies where `localField`
            foreignField: 'company_id' // is equal to `foreignField`
        });

        return schema;
    }
}
let schema = mongooseConnection.model<IModel>('Action', ActionSchema.schema);
export = schema; ''
