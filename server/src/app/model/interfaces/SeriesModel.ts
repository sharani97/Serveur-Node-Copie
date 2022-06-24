/**
 * Created by D. Hockley.
 */

import mongoose = require('mongoose');


interface SeriesModel extends mongoose.Document {
    title:string;
    description: string;
    id:string;
}

export = SeriesModel;
