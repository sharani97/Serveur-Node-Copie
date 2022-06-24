/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import mongoose = require('mongoose');
import MessagePageModel = require('./MessagePageModel');

interface ConversationModel extends mongoose.Document {
    title?:  string;
    dm:Boolean;
    usr1?:string;
    usr2?:string;
    members?: string[];
    current_page:number;
    pages?:MessagePageModel[];
    read:{
        [user:string]:{
            message:string,
            page:number
        }
    }
}

export = ConversationModel;