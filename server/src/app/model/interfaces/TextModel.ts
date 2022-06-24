import mongoose = require('mongoose');

interface TextModel extends mongoose.Document {
    creator_id: string;
    title:string; 
    description: string;
}


export = TextModel;
