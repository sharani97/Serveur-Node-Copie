/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import mongoose = require('mongoose');
import UserModel = require('./UserModel');


interface EntityModel extends mongoose.Document {
    name:   string;
    lowername: string;
    description: string;
    type:string;
    settings: Object;
    admins: Array<string>; // | Array<UserModel>;
    orgadmins: Array<string>; // | Array<UserModel>;
}

export = EntityModel;
