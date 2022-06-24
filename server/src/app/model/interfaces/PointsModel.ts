/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import mongoose = require('mongoose');

interface PointsModel extends mongoose.Document {
    user?:string,
    dom: string,
    cat:string,
    primary:boolean,
    amount:number
}

export = PointsModel;
