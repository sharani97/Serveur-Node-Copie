/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import mongoose = require('mongoose');
import Message = require('./Message');

import ConversationModel = require('./ConversationModel');

interface MessagePageModel extends mongoose.Document {
    conversation:  string | ConversationModel;
    messages: Array<Message>;
    nb:number; 
    open:Boolean;
    prev:string | MessagePageModel, 
    next:string | MessagePageModel  
}

export = MessagePageModel;