/**
 * Created by D. Hockley.
 */
import "reflect-metadata";

import ItemModel = require('./OrgItemModel')
import PointsModel = require('./PointsModel');
import TokenData = require('./TokenData');

import mongoose = require('mongoose');
import { Field, InterfaceType, ID} from 'type-graphql';

//@InterfaceType({description: "Object representing users"})
interface UserModel extends mongoose.Document {
    //@Field(type => ID)
    _id:        string;
    //@Field()
    first_name:  string;
    name:        string;
    username:    string;
    email:       string;
    token:       string;
    gtoken:      string;
    auth_type:   string;
    google_id:   string;
    status:      string;
    profileUrl:  string;
    settings:Object;
    validated:boolean;
    notificationTokens :Array<TokenData>;
    roles: Array<string>;
    last_connexion:Date;
    points?: Array<PointsModel>;
    created:Date;
    updated:Date;
    activated:Date;
}

export = UserModel;