/**
 * Created by DH
 */

import DataAccess = require('../DataAccess');
import IModel = require('./../../model/interfaces/EntityModel');
import idify = require('./makeId');
import { Schema } from 'mongoose';

const mongooseConnection = DataAccess.mongooseConnection;

class EntitySchema {


    static get schema () {
        const schema =  new Schema({
            name:   {type: String, required: true, unique:true},
            id:   {type: String, required: true, unique:true},
            description:   {type: String},
            type:String,
            admins:[ { type:Schema.Types.ObjectId, ref:'User'}],
            orgadmins:[ { type:Schema.Types.ObjectId, ref:'User'}],
            settings: Schema.Types.Mixed,
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

        schema.pre<IModel>('validate', function(next) {
            if (!this.id) {
                this.id = idify.idify(this.name);
            }
            this.lowername = idify.idify(this.name);

            next();
        });


        return schema;
    }
}
const schema = mongooseConnection.model<IModel>('Entity', EntitySchema.schema);
export = schema; ''

