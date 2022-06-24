/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import mongoose = require('mongoose');
import EntityModel = require('./EntityModel');
interface OrganizationModel extends mongoose.Document {
    name:   string;
    id: string;
    admins:Array<string>;
    members:Array<string>;
    entity?:string | EntityModel ; // if populate is called
    settings:Object;
    max_mission_nb?:number;
    max_user_nb?:number; 
    lowername:string;
}

export = OrganizationModel;
