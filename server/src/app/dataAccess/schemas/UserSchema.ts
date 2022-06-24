/**
 * Created by D. Hockley.
 */

import DataAccess = require('../DataAccess');
import IUserModel = require('./../../model/interfaces/UserModel');
import { Schema } from 'mongoose';

import idify = require('./makeId');

let mongoose = DataAccess.mongooseInstance;
let mongooseConnection = DataAccess.mongooseConnection;

class UserSchema {

    static get schema () {

        const schema =  new Schema({

            name : {
                type: String,
                trim: true,
                index: true,
                text: true
            },

            first_name : {
                type: String,
                trim: true,
                index: true,
                text: true
            },

            username : {
                type: String,
                unique: true,
                //required:true,
                trim: true,
                index: true,
                default:"pending",
                text: true
            },

            google_id : {
                type: String
            },

            id : {
                type: String,
                lowercase: true,
                trim: true//,
                // unique: true
            },

            roles : {
                type: [String],
                required: true,
                default:[]
            },

            notificationTokens : [{
                os: { type:String, enum: ['ios', 'android', 'amazon', 'osx', 'win', 'web'], },
                token:String,
                device:String,
                updated:Date
            }],

            email: {
                type: String,
                required: true,
                lowercase:true,
                trim: true,
                index: true,
                text: true
            },

            validated: {
                type:Boolean,
                default:false
            },

            token: {
                type: String,
            },
            gtoken: {
                type: String,
            },
            status: {
                type: String,
                enum: ['pending', 'created', 'validated'],
                default: 'created'
            },
            activated:{
                type:Date
            },
            settings: {
                type: Schema.Types.Mixed,
                default:{}
            },
            /*
            points: [{
                name: String, // eg. xp etc.
                id:mongoose.Schema.Types.ObjectId, // can refer to other objects
                ptype:String, // mission, xp, etc.
                amount:Number,
                bits:[{id:mongoose.Schema.Types.ObjectId, // can refer to other objects
                    amount: Number}]
            }],*/

            profileUrl:String,

            auth_type: {
                type: String,
                default : 'email'
            },

            last_connexion: Date

        },
        {
            timestamps: { createdAt: 'created', updatedAt: 'updated' },
            toJSON: { virtuals: true, 
                transform: function(doc, ret, options) {
                    delete ret.token;
                    delete ret.gtoken;
                    delete ret.__v;
                    delete ret.auth_type;
                    delete ret.notificationTokens;
            }},
            toObject: { virtuals: true }
        });

        schema.virtual('points', {
            ref: 'Points', // The model to use
            localField: '_id', // Find missions where `localField`
            foreignField: 'user' // is equal to `foreignField`
        });

        schema.pre<IUserModel>('save', function(next) {
            if (!this.id) {
                this.id = idify.idify(this.username);
            }
            next();
        });

        /*
        schema.options.toJSON = {
            transform: function(doc, ret, options) {
                delete ret.token;
                delete ret.gtoken;
                delete ret.__v;
                delete ret.auth_type;
                delete ret.notificationTokens;
            }
        };*/

        return schema;
    }
}


let schema = mongooseConnection.model<IUserModel>('User', UserSchema.schema);
export = schema;''
