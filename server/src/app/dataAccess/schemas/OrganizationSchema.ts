/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/OrganizationModel');
import { Schema } from 'mongoose';
import idify = require('./makeId');

const mongooseConnection = DataAccess.mongooseConnection;

class OrganizationSchema {


    static get schema () {
        const schema =  new Schema({
            name:   {type: String, required: true, text: true},
            lowername : {type: String, required: true, lowercase: true, unique:true},
            version: Number,
            entity:{
                type:  Schema.Types.ObjectId,
                ref: 'Entity'
            },
            id: {type: String, unique : true, required:true, lowercase:true },
            admins:[{
                type: Schema.Types.ObjectId,
                ref:'User',
            }],
            settings: Schema.Types.Mixed,
            members:[{
                type: Schema.Types.ObjectId,
                ref:'User',
            }],
            max_mission_nb:{
                type:Number,
                default:5
            },
            max_user_nb:{
                type:Number,
                default:5
            }
        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true },
            toObject: { virtuals: true }
        });

        schema.virtual('missions', {
            ref: 'Mission', // The model to use
            localField: '_id', // Find missions where `localField`
            foreignField: 'org' // is equal to `foreignField`
        });

        schema.virtual('groups', {
            ref: 'Group', // The model to use
            localField: '_id', // Find groups where `localField`
            foreignField: 'org' // is equal to `foreignField`
        });

        /*
        schema.virtual('admin_users', {
            ref: 'User', // The model to use
            localField: 'admins', // Find groups where `localField`
            foreignField: '_id' // is equal to `foreignField`
        });*/

        
        schema.pre<IModel>('validate', function(next) {
            if (!this.id) {
                this.id = idify.idify(this.name);
            }
            this.lowername = idify.idify(this.name);

            next();
        });

        schema.post('save', function(error, doc, next) {
            if (error.name === 'MongoServerError' && error.code === 11000) {
              next(new Error('An organisation already exists with this name/id'));
            } else {
              next(error.name);
            }
          });


        return schema;
    }
}
const schema = mongooseConnection.model<IModel>('Organization', OrganizationSchema.schema);
export = schema; ''

