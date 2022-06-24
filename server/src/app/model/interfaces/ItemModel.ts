import mongoose = require('mongoose');

interface ItemModel extends mongoose.Document {
    _id:string;
    id: string;
    // created and updated are now automatically generated in schema
}


export = ItemModel;
