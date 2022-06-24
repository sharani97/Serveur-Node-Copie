/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import mongoose = require('mongoose');

interface FileModel extends mongoose.Document {
    creator_id: string;
    ext: string; // extension, 3 letters 
    filetype:string; // image, report, contract
    url: string;
    //add
    key:string;  // path 
    date:string; // as YYYYMMDD
    bucket:string,
    target_id:string,
    target_type:string,
    status: string
}

export = FileModel;
