
import express = require('express');
import UserBusiness = require('./../app/business/UserBusiness');
import User = require('./../app/dataAccess/schemas/UserSchema');
import JwtUser = require('../app/model/interfaces/JwtUser');

import IPoints = require('./../app/model/interfaces/Points');

import Notif = require('./../app/dataAccess/schemas/NotifSchema');
import NotifModel = require('./../app/model/interfaces/NotifModel');

import Conversation = require('./../app/dataAccess/schemas/ConversationSchema');

import Org = require('./../app/dataAccess/schemas/OrganizationSchema');

import Friendship = require('./../app/dataAccess/schemas/FriendshipSchema');
import * as friend_jobtypes from './../config/constants/friend_jobtypes';

import Points = require('./../app/dataAccess/schemas/PointsSchema');
import PointsModel = require('./../app/model/interfaces/PointsModel');


import Post = require('./../app/dataAccess/schemas/PostSchema');
import PostModel = require('./../app/model/interfaces/PostModel');

import Like = require('./../app/dataAccess/schemas/LikeSchema');

import IdeaModel = require('./../app/model/interfaces/IdeaModel');

import UserModel = require('./../app/model/interfaces/UserModel');

import UserActionResponse = require ('./../app/model/interfaces/UserActionResponse');
import ValidUserUpdate = require ('./../app/model/interfaces/ValidUserUpdate');


import TokenData = require ('./../app/model/interfaces/TokenData');

import mongoose = require('mongoose');
import CoreController = require('./CoreController');

import * as errors from '../config/messages/errors';

import { CustomError } from '../app/shared/customerror';
import * as jobtypes from './../config/constants/jobtypes';

import idify = require('../app/dataAccess/schemas/makeId');

import * as missionerrors from '../config/messages/mission.errors';

import { NotifUtilities } from './../app/utilities/NotifUtilities'

import UserReq = require('../middleware/UserReq');
import { PostUtilities } from '../app/utilities/PostUtilities';
import { ChatUtilities } from '../app/utilities/ChatUtilities';
import MessagePageModel = require('../app/model/interfaces/MessagePageModel');
import Message = require('../app/model/interfaces/Message');

class ProfileController extends CoreController {

    constructor () {
        super();

        this.getAdminOrgs = this.getAdminOrgs.bind(this);
        this.getSettings = this.getSettings.bind(this);
        this.updateSettings = this.updateSettings.bind(this);
        this.updatePassword = this.updatePassword.bind(this);
        this.updatePushToken = this.updatePushToken.bind(this);
        // this.sendMessage = this.sendMessage.bind(this);
        this.getUser = this.getUser.bind(this);
        this.getUsers = this.getUsers.bind(this);

        this.sendMessageToUser = this.sendMessageToUser.bind(this);
        this.getCurrentMessages = this.getCurrentMessages.bind(this);
        this.getOrCreateConversation = this.getOrCreateConversation.bind(this);
        this.getConversations = this.getConversations.bind(this);
        this.getConversation = this.getConversation.bind(this);
        this.setReadMessage = this.setReadMessage.bind(this);
        this.getUnreadMessages = this.getUnreadMessages.bind(this);

        this.updateUser = this.updateUser.bind(this);
        this.updateUser$ = this.updateUser$.bind(this);

        this.getPoints = this.getPoints.bind(this);
        this.removeToken = this.removeToken.bind(this);

        this.getFriend = this.getFriend.bind(this);
        this.getFriends = this.getFriends.bind(this);
        this.addFriend = this.addFriend.bind(this);
        this.removeFriend = this.removeFriend.bind(this);

        this.getPosts = this.getPosts.bind(this);

        this.getNotifs = this.getNotifs.bind(this);
        this.deleteNotif = this.deleteNotif.bind(this);

        this.getNotif = this.getNotif.bind(this);

        this.setRead = this.setRead.bind(this);

        this.findUser = this.findUser.bind(this);

        this.requestDelete = this.requestDelete.bind(this);


    }



    async updateUser$(usr:JwtUser, data:ValidUserUpdate):Promise<UserModel> {

        let user = await User.findById(usr.id).exec();

        let update = <ValidUserUpdate> data;

        if (update.email) {
            let check = await User.find({"email":update.email}).exec();
            if (check != null) {
                throw Error(errors.EMAIL_EXISTS);
            }
            user.email = update.email;
            user.validated = false;
            this.addJob$(usr, jobtypes.EMAIL_UPDATED, update);
        }

        if (update.username) {
            let check = await User.findOne({"username":update.username}).exec();
            if (check != null) {
                throw Error(errors.USERNAME_EXISTS);
            }
            user.username = update.username;
            user.id = idify.idify(update.username);
        }

        if (update.first_name) user.first_name = update.first_name;
        if (update.name) user.name = update.name;
        if (update.profileUrl) user.profileUrl = update.profileUrl;

        await user.save();

        /*
        first_name?: string;
        name?: string;
        nickname?: string;
        profileUrl?:string;
        username?:    string;
        email?:       string;
        */



        return user;
    }

    setRead (req: UserReq.IUserRequest, res: express.Response): void {
        try {

            let target =  new mongoose.Types.ObjectId(req.user.id);

            let ids = []
            if (req.params._id != undefined) {
                ids.push(new mongoose.Types.ObjectId(req.params._id));
            }
            if (req.body.ids != undefined) {
                for (let id of req.body.ids) {
                    ids.push(new mongoose.Types.ObjectId(id));
                }
            }

            console.log("IDs : ", ids);

            Notif.updateMany({_id:{$in:ids}, target:target}, {read:true}).exec().then(()=>{
                this.sendResult(res, null, {'status':'ok'})
            }).catch((err) => {
                this.requestError(res, err, null);
            })

        } catch(err) {
            this.requestError(res, err);
        }
    }

    checkNotif (req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let target =  new mongoose.Types.ObjectId(req.user.id);

            let ids = []
            if (req.params._id != undefined) {
                ids.push(new mongoose.Types.ObjectId(req.params._id));
            }
            if (req.body.ids != undefined) {
                for (let id of req.body.ids) {
                    ids.push(new mongoose.Types.ObjectId(id));
                }
            }

            NotifUtilities.checkNotifsValidity$(ids).then((ret)=>{
                this.sendResult(res, null, {'status':ret})
            }).catch((err) => {
                this.requestError(res, err, null);
            })

        } catch(err) {
            this.requestError(res, err);
        }
    }


    updateUser(req: UserReq.IUserRequest, res: express.Response):void {

        try {

            let _user = req.user;
            let update = <ValidUserUpdate> req.body;
            this.updateUser$(_user, update).then((usr) => {
                this.sendResult(res, null, usr);
            }).catch(e => {
                this.requestError(res, e);
            })

        } catch(e) {
            this.requestError(res,errors.UNCAUGHT_ERROR);
        }
    }

    getAdminOrgs(req: UserReq.IUserRequest, res: express.Response):void {

        try {
            let _user = req.user;
            Org.find({'admins':new mongoose.Types.ObjectId(_user.id)})
                .populate({path: 'groups' }/* missions'}*/).then((data) => {
                res.json(data);
            })

        } catch(e) {
            console.log(e);
            res.status(400).json({'error': e});
        }

    }

    getSettings(req: UserReq.IUserRequest, res: express.Response): void {

        try {

            let _user = req.user;
            User.findById(_user.id, function(err, user) {
                if (err) {
                    this.requestError(res, err);
                    return;
                }
                if (user) {
                    res.json(user.settings);
                } else {
                    this.requestError(res, errors.NO_SUCH_USER, 404);
                }
            });
        } catch(e) {
            this.requestError(res,errors.UNCAUGHT_ERROR);
        }
    }


    async getPoints$(user:JwtUser):Promise<Array<IPoints>> {
        let uid = new mongoose.Types.ObjectId(user.id)

        let pts = await Points.find({user:uid, dom:null}).exec();
        let _pts:IPoints[] = [];
        for (let _pt of pts) {

            let pt:IPoints
            if (_pt.hasOwnProperty("toObject")) {
                pt = _pt.toObject() as IPoints;

            } else {
                pt = _pt as IPoints;
            }
            delete pt["user"];
            delete pt["__v"];
            _pts.push(pt);
        }

        return _pts;
    }

    getPoints(req: UserReq.IUserRequest, res: express.Response): void {
        try {

            this.getPoints$(req.user).then((data) => {
                this.sendResult(res, null, data);
            }).catch((e) => {
                this.requestError(res,e);
            })

        } catch(e) {
            this.requestError(res,e);
        }
    }

    updateSettings(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let _user = req.user;
            let settings = req.body;
            User.findById(_user.id, function(err, user) {

                if (err) {
                    this.requestError(res, err);
                    return;
                }

                user.settings = Object.assign({}, user.settings, settings);
                user.save().then((ok) => {
                    res.json(user.settings);
                }).catch(e => {
                    this.requestError(res,e);
                });
            });
        } catch(e) {
            this.requestError(res,e);
        }
    }

    getConversations(req: UserReq.IUserRequest, res: express.Response) {

      try{
          let user = req.user;

          ChatUtilities.getConversations$(user).then((convs) => {
              this.sendResult(res, null, convs);
          }).catch((e) => {
              this.requestError(res,e, 400);
          });
      } catch (e)  {
          console.log('error in request', e);
          res.status(400).send({'error': 'error in your request'});
      }
    }

    getConversation(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            let other_id = req.params.user_id;

            ChatUtilities.getIConversation$(user, other_id).then((convs) => {
                this.sendResult(res, null, convs);
            }).catch((e) => {
                this.requestError(res,e, 400);
            });
        } catch (e)  {
            console.log('error in request', e);
            res.status(400).send({'error': 'error in your request'});
        }
    }


    getCurrentMessages(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            ChatUtilities.getMessages$(user).then((convs) => {
                this.sendResult(res, null, convs);
            }).catch((e) => {
                this.requestError(res,e, 400);
            });
        } catch (e)  {
            console.log(e);
            res.status(400).send({'error': 'error in your request'});
        }
    }


    getUnreadMessages(req: UserReq.IUserRequest, res: express.Response): void {

        try {
            let conversation = req.params.conv_id;
            let user = req.user;

            Conversation.findById(conversation).exec().then((conv) => {
                ChatUtilities.getUnreadInConversation$(user,conv).then((nb) => {
                    this.sendResult(res, null, {count:nb});
                }).catch((e) => {
                    this.requestError(res,e, 400);
                });
            }).catch((e) => {
                this.requestError(res,e, 400);
            });

        } catch(e) {
            console.log(e);
            res.status(400).send({'error': e});
        }

    }


    setReadMessage(req: UserReq.IUserRequest, res: express.Response): void {

        try {
            let other_user = req.params.user_id;
            let message_id = req.params.message_id;
            ChatUtilities.setReadMessage$(req.user, other_user, message_id).then((status) => {
                this.sendResult(res, null, {status:status});
            }).catch((e) => {
                this.requestError(res,e, 400);
            });
        } catch(e) {
            console.log(e);
            res.status(400).send({'error': e});
        }

    }


    getOrCreateConversation(req: UserReq.IUserRequest, res: express.Response): void {
        try {

            let user = req.user;
            let other_user = req.params.user_id;

            ChatUtilities.getOrCreateConversation$(user, other_user).then((conv) => {
                this.sendResult(res, null, conv);
            }).catch((e) => {
                console.log(e);
                this.requestError(res,e, 400);
            });
        } catch (e)  {
            console.log(e);
            res.status(400).send({'error': 'error in your request'});
        }
    }

    async getNotifs$(user:JwtUser):Promise<Array<NotifModel>> {

        let uid = new mongoose.Types.ObjectId(user.id);
        let notifs = Notif.find({target:uid, read:false}).sort({updated:-1}).limit(20).exec();
        return notifs; // as by ref, it should work
    }


    getNotifs(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            this.getNotifs$(user).then((notifs) => {
                this.sendResult(res, null, notifs);
            }).catch((e) => {
                this.requestError(res,e, 400);
            });
        } catch (e)  {
            console.log(e);
            this.requestError(res, 'error');
        }
    }



    deleteNotif(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            let _id = req.params.id;
            Notif.remove({
                _id: new mongoose.Types.ObjectId(_id),
                target:new mongoose.Types.ObjectId(user.id)
            }).exec().then((ok) => {
                this.sendResult(res, null, ok);
            }).catch((e) => {
                this.requestError(res,e, 400);
            });
        } catch (e)  {
            console.log(e);
            this.requestError(res, 'error');
        }

    }


    

    async sendMessage$(user:JwtUser, to:string, msg:string):Promise<Message> {
      let ret = await ChatUtilities.sendMessage$(user, to, msg);
      return ret;
    }

    getNotif(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            let _id = req.params.id;

            Notif.findOne({
                    _id: new mongoose.Types.ObjectId(_id),
                    target:new mongoose.Types.ObjectId(user.id)
                }).exec().then((notif) => {
                    this.sendResult(res, null, notif);
            }).catch((e) => {
                this.requestError(res,e, 400);
            });
        } catch (e)  {
            console.log(e);
            this.requestError(res, 'error');
        }
    }

    sendMessageToUser(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            let to_user = req.body.to;
            let message = req.body.msg;

            ChatUtilities.sendMessage$(user, to_user, message).then((page) => {
                this.sendResult(res, null, page);
            }).catch((e) => {
                this.requestError(res,e, 400);
            });
        } catch (e)  {
            console.log(e);
            res.status(400).send({'error': 'error in your request'});
        }
    }


    async updatePushToken$(user:JwtUser, tokenData: TokenData): Promise<void> {

        let _user = await User.findById(user.id).exec();
        for(let td of _user.notificationTokens) {
            if (td.device == tokenData.device) {
                td.updated = tokenData.updated;
                td.token = tokenData.token
                await _user.save();
                return;
            }
        }
        _user.notificationTokens.push(tokenData);
        await _user.save();
    }

    updatePushToken(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            const _token: string = req.body.token;
            const _os: string = req.body.os;
            const _device:string = req.body.device
            const _date = new Date();
            const data:TokenData = {
                token:_token,
                os:_os,
                updated:_date,
                device:_device
            }

            this.updatePushToken$(req.user, data).then(() => {
                this.sendResult(res, null, {result:'ok'});
            }).catch((e) => {
                this.requestError(res,e, 400);
            });

        } catch (e)  {
            res.send({'error': errors.UNCAUGHT_ERROR});

        }
    }

    findUser(req: UserReq.IUserRequest, res: express.Response) {

        try {

            let _text: string = req.params._name;

            let _query = [];

            let names = ["name", "first_name", "username"];

            // split _text into words
            let bits = _text.split(' ');

            // make a regex to match one of the word starts (hence the \b)
            let search = bits.map(t => '\\b' + t).join('\(.*?\)');
            let re: RegExp = new RegExp(search, 'i');

            for (let name of names) {
                let o = new Object;
                o[name] = re;
                _query.push(o);
            }

            User.find().or(_query).exec().then((data) => {
                this.sendResult(res, null, data);
            }).catch((e) => {this.requestError(res,e);});

        } catch (e)  {
            this.requestError(res,e);
        }
    }


    removeFriend(req: UserReq.IUserRequest, res: express.Response): void {
        try {

            let user = req.user;
            let other_id = req.params.id;
            let _id = new mongoose.Types.ObjectId(user.id);
            let friend_id = new mongoose.Types.ObjectId(other_id);
            Friendship.findOneAndRemove({$or:[{from:_id, to:friend_id}, {from:friend_id, to:_id}]}).exec().then((info) => {
                this.sendResult(res, null, info);
            }).catch((e) => {this.requestError(res,e);});
        } catch (e)  {
            this.requestError(res,e);
        }
    }

    addFriend(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            let other_id = req.params.id;
            let _id = new mongoose.Types.ObjectId(user.id);
            let friend_id = new mongoose.Types.ObjectId(other_id);
            Friendship.findOne({$or:[{from:_id, to:friend_id}, {from:friend_id, to:_id}]}).exec().then((friend) => {

                let dirty = false;
                let job = null;

                if (friend == null) {
                    friend = new Friendship({
                        from: user.id,
                        to:other_id,
                        state:"req"
                    });
                    dirty = true;
                    job = friend_jobtypes.NEW_FRIENDSHIP_REQUETS;

                } else {

                    if (friend.state != "ok") {
                        if (friend.state == "ko") {
                            // new request cancels old
                            friend.from = user.id;
                            friend.to = other_id;
                            friend.state = "req";
                            dirty = true;
                            job = friend_jobtypes.NEW_FRIENDSHIP_REQUETS;
                        }

                        if (friend.state == "req") {
                            // check if accepting
                            if (friend.to == user.id) {
                                friend.state = "ok";
                                dirty = true;
                                job = friend_jobtypes.FRIENDSHIP_ACCEPTED;
                            }
                        }
                    }
                }

                if (!dirty) {
                    this.sendResult(res, null, friend);
                    return;
                }

                friend.save().then(() => {
                    this.addJob$(user, job, {from:user.id, to:other_id}).then(()=> {
                        this.sendResult(res, null, friend);
                    }).catch((e) => {this.requestError(res,e);});
                }).catch((e) => {this.requestError(res,e);});

            }).catch((e) => {this.requestError(res,e);});
        } catch (e)  {
            this.requestError(res,e);
        }
    }

    getFriend(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            let other_id = req.params.id;
            let _id = new mongoose.Types.ObjectId(user.id);
            let friend_id = new mongoose.Types.ObjectId(other_id);
            Friendship.findOne({$or:[{from:_id, to:friend_id},{from:friend_id, to:_id}]})
                        .exec().then((friend) => {
                    if (friend) {
                        this.sendResult(res, null, friend);
                    } else {
                        this.requestError(res, errors.ITEM_NOT_FOUND, 400)
                    }
            }).catch((e) => {
                this.requestError(res,e, 400);
            });
        } catch (e)  {
            console.log(e);
            res.status(400).send({'error': 'error in your request'});
        }
    }

    getFriends(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            let _id = new mongoose.Types.ObjectId(user.id);
            Friendship.find({$or:[{from:_id}, {to:_id}]}).exec().then((friendships) => {
                this.sendResult(res, null, friendships);
            }).catch((e) => {
                this.requestError(res,e, 400);
            });
        } catch (e)  {
            console.log(e);
            res.status(400).send({'error': 'error in your request'});
        }
    }

    getPosts(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            PostUtilities.getPosts(user).then((posts) => {
                this.sendResult(res, null, posts);
            }).catch((e) => this.requestError(res,e, 400));
        } catch (e)  {
            console.log(e);
            res.status(400).send({'error': 'error in your request'});
        }
    }


    async getUser$(id: string): Promise<any> {


        let _id = new mongoose.Types.ObjectId(id);
        let user = await User.findById(id).exec();
        let pts = await Points.find({user:_id, dom:null}).exec();

        let friends = await Friendship.find({$or:[{to:id, state:'ok'}, {from:id, state:'ok'}]}).exec();
        let friend_ids = friends.map(data => {
            if (data.from.toString() == id) {
                return data.to;
            } else {
                return data.from;
            }
        })
        return {
            username:user.username,
            first_name:user.first_name,
            name:user.name,
            created:user.created,
            profileUrl:user.profileUrl,
            points:pts,
            friends:friend_ids,
            settings:user.settings
        }

    }

    getUsers(req: UserReq.IUserRequest, res: express.Response): void {
        this.sendResult(res, null, []);
    }

    getUser(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            // populate ideas too
            let id = req.params.id;

            this.getUser$(id).then(ret => {
                this.sendResult(res, null, ret);
            }).catch((e) => {
                this.requestError(res,e, 400);
            });
        } catch (e)  {
            this.requestError(res,e, 400);
        }
    }

    removeToken(req: UserReq.IUserRequest, res: express.Response): void {
    }


    updatePassword(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            const _pass: string = req.body.password;
            const business = new UserBusiness();

            business.updateUserPassword(req.user.id, _pass, (error, result) => {
                if (error) {
                    res.status(403).send({'error': error});
                } else {
                    console.log(result);
                    res.send({'success': 'success'});
                }
            });
        } catch (e)  {
            this.requestError(res,e);
        }
    }


    async requestDelete$(user:JwtUser): Promise<boolean> {
        await this.addJob$(user, jobtypes.USER_REQUESTED_DELETE,
            {_id:user.id},
            new Date(Date.now())
        );
        return true;
    }

    requestDelete(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user:JwtUser = req.user;
            this.requestDelete$(user).then((ok) => {
                this.sendResult(res, null, {status:ok});
            }).catch((e) => {
                this.requestError(res,e);
            });
        } catch (e)  {
            this.requestError(res,e);
        }
    }



}

export = ProfileController;
