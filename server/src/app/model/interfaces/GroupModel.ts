/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import mongoose = require('mongoose');

interface GroupModel extends mongoose.Document {
    name:   string;
    description: string;
    id: string;
    org: string; 
    members:string[];
}

export = GroupModel;
