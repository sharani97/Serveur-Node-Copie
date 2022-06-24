import mongoose = require('mongoose');

interface FriendshipModel extends mongoose.Document {
    from: string;
    to:string;
    state:string; //ok, req, ko
    other?: string;
    // created and updated are now automatically generated in schema
}


export = FriendshipModel;
