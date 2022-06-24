/*
    sender:mongoose.Schema.Types.ObjectId,
    text:String, 
    ts:Date,
*/
import Message = require('./Message');

interface Conversation {
    usr1: string;
    usr2: string;
    _id:string; // set on server for incoming, not sent just stored 
    messages?:Array<Message>,
    unread:number,
    current_page: number,
    read:{
        [user:string]:{
            message:string,
            page:number
        }
    }
}

export = Conversation;