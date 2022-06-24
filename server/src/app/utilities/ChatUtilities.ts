import JwtUser = require('../model/interfaces/JwtUser');
import ConversationModel = require('./../model/interfaces/ConversationModel');
import IConversation = require('./../model/interfaces/Conversation');
import Message = require('./../model/interfaces/Message');
import Url = require('../model/interfaces/Url');


import Conversation = require('./../dataAccess/schemas/ConversationSchema');
import MessagePage = require('./../dataAccess/schemas/MessagePageSchema');


import mongoose = require('mongoose');

import * as jobtypes from '../../config/constants/jobtypes';


import { JobUtilities } from './JobUtilities';

export class ChatUtilities {


    static async getUnreadInConversation$(user:JwtUser, conversation:ConversationModel):Promise<number> {

        // console.log('in get unread in conv');

        let count = 0;

        conversation.read = conversation.read || {};
        let current_read = conversation.read[user.id.toString()];

        let current_msg_id = "  ";
        let current_page = 0;

        if (current_read != undefined) {
            current_msg_id = current_read.message;
            current_page = current_read.page;
        }

        let active_page = conversation.current_page;

        let pages = await MessagePage.find({
            conversation:conversation._id,
            nb: {$gte: current_page}
        }).exec();


        //console.log('unread pages', pages);

        for (let page of pages) {
            if (page.nb > current_page) {
                count += page.messages.length
            } else {
                for (let msg of page.messages) {
                    if (msg._id.toString() > current_msg_id.toString()) {
                        count += 1;
                    }
                }
            }
        }
        return count;
    }



    static async getIConversation$(user:JwtUser, other_user:string):Promise<IConversation> {

        let conv = await ChatUtilities.getConversation$(user, other_user);
        return {
            usr1: conv.usr1.toString(),
            usr2: conv.usr2.toString(),
            _id: conv._id,
            read:  conv.read,
            current_page: conv.current_page,
            unread: await ChatUtilities.getUnreadInConversation$(user, conv)
        }
    }


    static async getConversation$(user:JwtUser, other_user:string):Promise<ConversationModel> {
        let usr1 = new mongoose.Types.ObjectId(user.id)
        let usr2 = new mongoose.Types.ObjectId(other_user);

        if (usr2 < usr1) {
            let tmp = usr2;
            usr2 = usr1;
            usr1 = tmp;
        }
        // just for safety's sake
        return await Conversation.findOne({'usr1':usr1, 'usr2':usr2}).exec();

    }

    
    static async getFullConversations$(user:JwtUser, limit=-1, cursor = null):Promise<Array<ConversationModel>> {

        let usr = new mongoose.Types.ObjectId(user.id);

        let query = { $or: [{'usr1':usr}, {'usr2':usr}]};
        // https://stackoverflow.com/questions/5539955/how-to-paginate-with-mongoose-in-node-js/23640287#23640287
        
        return await Conversation.find(query).exec();
    }


    static async getConvMessages$(conv:ConversationModel):Promise<Array<Message>> {

        let page = await MessagePage.findOne({
            'conversation':conv._id,
            'nb':conv.current_page
        }).exec();

        return page.messages;

    }

    static async getConversations$(user:JwtUser):Promise<Array<IConversation>> {

        let convs = await Conversation.find({$or:[{'usr1':user.id},{'usr2':user.id}]}).exec();

        let rets:Array<IConversation> = [];

        for (let conv of convs) {

            let ret:IConversation = {
                usr1: conv.usr1.toString(),
                usr2: conv.usr2.toString(),
                _id: conv._id,
                read:  conv.read || {},
                current_page: conv.current_page,
                unread: await ChatUtilities.getUnreadInConversation$(user, conv)
            }
            rets.push(ret);
        }

        return rets;

    }

    static async getOrCreateConversation$(user:JwtUser, other_user:string):Promise<IConversation> {

        let usr1 = new mongoose.Types.ObjectId(user.id)
        let usr2 = new mongoose.Types.ObjectId(other_user);

        if (usr2 < usr1) {
            let tmp = usr2;
            usr2 = usr1;
            usr1 = tmp;
        }

        let conv = await ChatUtilities.getConversation$(user, other_user);

        if (conv) {

            let page = await MessagePage.findOne({
                'conversation':conv._id,
                'nb':conv.current_page
            }).exec();

            let messages = [];

            if (page) {
                messages = page.messages;
            }

            let ret:IConversation = {
                usr1: conv.usr1.toString(),
                usr2: conv.usr2.toString(),
                _id: conv._id,
                current_page: conv.current_page,
                messages : messages,
                read:  conv.read,
                unread: await ChatUtilities.getUnreadInConversation$(user, conv)
            }
            return ret; // as by ref, it should work
        } else {
            // create new conversation & message page
            let newConv = new Conversation({
                dm:true,
                current_page:0,
                usr1:usr1,
                usr2:usr2,
                read:{}
            });
            await newConv.save();
            let ret:IConversation = {
                usr1: newConv.usr1.toString(),
                usr2: newConv.usr2.toString(),
                _id:newConv._id,
                current_page: newConv.current_page,
                messages : [],
                unread:0,
                read:{}
            }
            return ret; // as by ref, it should work
        }
    }

    static async getMessages$(user:JwtUser):Promise<Array<ConversationModel>> {

        let uid = new mongoose.Types.ObjectId(user.id)
        let convs = await Conversation.find({$or:[{'usr1':uid},{'usr2':uid}]}).exec();
        let cDict:{[key:string]:ConversationModel} = {};

        let conv_id = convs.map((conv)=> {
            let id = conv._id;
            conv.pages = [];
            cDict[id.toString()] = conv;
            return id;
        });

        let pages = await MessagePage.find({
            'conversation':{$in:conv_id},
            'next':null
        }).exec();

        for(let page of pages) {
            cDict[page.conversation as string].pages.push(page);
        }

        return convs; // as by ref, it should work
    }


    static async setReadMessage$(user:JwtUser, other_user:string,message_id:string):Promise<Boolean> {

        let conversation = await this.getConversation$(user, other_user); //await Conversation.findById(conv).exec();

        if (conversation.read == undefined) {

            conversation.read = {
                [user.id] : {
                message:message_id,
                page:conversation.current_page
                }
            };
            conversation.markModified('read');
            await conversation.save()
            return true;
        }

        let current_read = conversation.read[user.id];

        if ((current_read == undefined) || (current_read.message.toString() < message_id)) {
            conversation.read[user.id] = {
                message:message_id,
                page:conversation.current_page
            };
            conversation.markModified('read');
            await conversation.save()
            return true;
        }

        return false;

    }

    static async addMessageWithConversation$(conv:ConversationModel, msg:Message):Promise<Message> {

        let mp = await MessagePage.findOneAndUpdate(
            {
                conversation:conv._id,
                nb:conv.current_page,
                open:true
            },
            {

                conversation:conv._id.toString(),
                nb:conv.current_page,
                open:true,
                $push: {
                    messages: msg
                }
            },
            { 'new':true, 'upsert':true}).exec()

        let msg_id = mp.messages[mp.messages.length-1]._id;
        conv.read = conv.read || {};

        conv.read[msg.from] = {
            message: msg_id.toString(),
            page:conv.current_page
        };
        conv.markModified('read');

        if (mp.messages.length > 100) {
            mp.open = false;
            await mp.save();
            conv.current_page += 1;
        }

        await conv.save();

        msg._id = msg_id;
        msg.conv = conv._id; // what (type) is the id ??
        return msg;
    }


    static async sendMessage$(user:JwtUser, to:string, msg:string, notify = true, urldata:Url = null):Promise<Message> {

        let usr1 = new mongoose.Types.ObjectId(to);
        let usr2 = new mongoose.Types.ObjectId(user.id);

        if (usr2 < usr1) {
            let tmp  = usr2;
            usr2 = usr1;
            usr1 = tmp;
        }

        // why are we not using getOrCreateConversation here ?
        let conv = await Conversation.findOne({'usr1':usr1, 'usr2':usr2}).exec(); // IF there is one

        let _msg:Message = {
            from:user.id,
            msg:msg,
            urldata:urldata
        };

        if (!conv) {
            //  why have we not used getOrCreateConversation$ ? because id returns an IConversation")
            conv = new Conversation({
                usr1:usr1,
                usr2:usr2,
                dm:true,
                current_page:0,
                read:{}
            });
            await conv.save();
        }
        if (notify) {
            // console.log("adding job : ", jobtypes.WARN_USER_MESSAGED, msg);
            // add a 5 minute delay to concatenate !!
            await JobUtilities.addJob$(user, jobtypes.WARN_USER_MESSAGED,
                {from:user.id, to:to, msg:msg},
                new Date(Date.now() + (1000 /*sec*/ * 5 /*min*/))
            );
        } //else {
          // console.log("no notify needed");
        //}

        return await this.addMessageWithConversation$(conv, _msg);
    }


}