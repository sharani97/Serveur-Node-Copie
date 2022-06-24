/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import mongoose = require('mongoose');

interface LocModel extends mongoose.Document {
    id: string; // this is key:lang
    key: string;
    lang: string;
    text: string;
}

export = LocModel;
