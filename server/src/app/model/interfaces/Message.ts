import Url = require("./Url");

/*
    sender:mongoose.Schema.Types.ObjectId,
    text:String, 
    ts:Date,
*/

interface Message {
    from: string;
    msg: string;
    url?: string;
    to?: string;
    etag?:string;
    urldata?: Url;
    _id?:string; // set on server for incoming, not sent just stored 
    jwt?:string; // for incoming auth, not stored
    conv?:string; // conversation, for incoming/outgoing messages, not stored directly
}

export = Message;