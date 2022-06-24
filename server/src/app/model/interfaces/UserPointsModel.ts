

import mongoose = require('mongoose');


interface UserPointsModel {
    name?: string, // eg. xp etc.
    id?:mongoose.Schema.Types.ObjectId, // can refer to other objects 
    ptype?:string, // mission, xp, etc.
    amount:number,
}

export = UserPointsModel;