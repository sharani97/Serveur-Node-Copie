/**
 * Created by DH
 */

import BaseRepository = require('./../repository/BaseRepository');
// import IBaseBusiness = require('./common/BaseBusiness');

import JobRepository = require('./../repository/JobRepository');
import JobModel = require ('./../model/JobModel');
import IJobModel = require ('./../model/interfaces/JobModel');

// import JWTUser = require ('./../model/interfaces/');

import EventRepository = require('../repository/SystemEventRepository');
import EventModel = require ('../model/SystemEventModel');
import IEventModel = require ('../model/interfaces/SystemEventModel');

import JwtUser = require ('./../model/interfaces/JwtUser');

import SystemEventFactory = require ('./../model/events/SystemEventFactory')

import mongoose = require('mongoose');
import { Document } from 'mongoose';

import { deleteResult} from '../shared/deleteResult';

abstract class BaseBusiness <Doc extends mongoose.Document, Repository extends BaseRepository<Doc>, EFactory extends SystemEventFactory<Doc>>  {

    protected _repository: Repository;
    protected _eventRepository: EventRepository;
    protected _name: String;
    protected _type: String; // for message/notif generation
    protected _factory:EFactory;
    protected _protectedFields:Array<string>;

    init(): Repository {
        throw new Error('You must overload the init() method on Business');
    }

    constructor () {
        this._repository = this.init();
    }

    addJob(user: JwtUser, task: string, payload: Object, err: any, res: any, callback: (error: any, result: any) => void) {

        if (err) {
            console.log('base business add job : error ', err);
            callback(err, res);
            return;
        }

        // maybe not the right place, e.g. some repo methods might not return a value, e.g. delete ?
        if (!res || !res._id) {
            callback({'error': 'no such item'}, res);
            return;
        }

        let job = <IJobModel> {
            creator_id : user.id,
            progress: 0,
            task : task,
            state: 'created',
            payload: payload,
            output:{},
            //org: user['org'] ?user['org']:undefined
        };

        let job_repo = new JobRepository();
        job_repo.create(job, callback);

    }


    addEvent(event: IEventModel, callback: (error: any, result: any) => void) {

        if (!this._eventRepository) {
            this._eventRepository = new EventRepository();
        }
        this._eventRepository.create(event, callback);
    }

    createEvent(user: JwtUser, action: string, payload: Object, err: any, res: any, callback: (error: any, result: any) => void) {

        console.log('in add Event');

        if (err) {
            console.log('base business add event : error existed, return');
            callback(err, res);
            return;
        }

        if (!res || !res._id) {
            console.log('base business add event : no itm, return');
            callback({'error': 'no such item'}, res);
            return;
        }

        let itm = <IEventModel> {
            creator_id : user.id,
            type:action,
            target_type: this._type,
            target:res._id,
            payload: payload
        };

        this.addEvent(itm, callback);
    }

    checkAddEvent(before:Doc, after:Doc, user:JwtUser, callback:(error:any, result:any)=>void) {

    }




    create (item: Doc, callback: (error: any, result: any) => void) {
        this._repository.create(item, callback);
    }

    count (callback: (error: any, result: any) => void) {
        this._repository.count(callback);
    }

    retrieve (callback: (error: any, result: any) => void) {
        this._repository.retrieve(callback);
    }

    retrievePage (n: number, pagesize: number, callback: (error: any, result: any) => void) {
        this._repository.retrievePage(n, pagesize, callback);
    }


    action (_id: string, _name: string, _payload: any, user:JwtUser, callback: (error: any, result: any) => void) {
        // default behavior = do nothing

        console.log(`calling action ${_name} on ${_id}`, user.id, _payload); // needs cleanup

        this._repository.findById(_id, callback);
        // console.log(`calling action ${_name} on ${_id}`, _user, _payload);

        // let new_callback = (err, res) => {


            // callback(err,res);
        // };



        // this._repository.findById(_id, callback);

        /*
            this._repository.updateField(_id, 'date',  <Date>_payload.date, (err, res) => {
            let data = {};
            if (res && res.id) {
                const ms = <IModel>res;
                data = {
                    milestone: ms.id,
                    contract: ms.contract_id
                };
            }
            this.addJob(_user, 'NOTIFY_MILESTONE_DELAYED', data, err, res, callback);

        */


    }

    update (_id: string,  item: Doc, user:JwtUser, callback: (error: any, result: any) => void) {


        let new_item = item;
        let old_item:Doc;

        let eventList:Array<IEventModel>;

        let new_callback:(err,res) => void;

        new_callback = (err, res) => {
            while(eventList.length > 0) {
                let iEvent = eventList.pop();
                this.addEvent(iEvent, new_callback);
            }
            callback(err,res);
        }

        this._repository.findById(_id, (err, res) => {
            if (err) {
                callback(err, res);
            } else {
                if (res && res._id) {
                    eventList = this._factory.generateEvents(res, item);
                    this._repository.update(_id, item, new_callback);
                } else {
                    callback({'error': `update - no such item ${_id}`}, res);
                }
            }
        });
    }

    setFieldAndLog (_id: string, field: string, value: any, logical_name:string, _user:JwtUser, callback: (error: any, result: any) => void) {

        console.log("set field and log in base business");

        let fullname = `${this._type}_${logical_name}`.toUpperCase();
        let old_value:any = undefined;
        let item:Doc;

        let event:Event


        this._repository.findById(_id, (err, res) => {
            if (err) {
                callback(err, res);
            } else {
                if (res && res._id) {
                    item = <Doc>res;
                    old_value = item[field]; // nb mutation pbs ????
                    if (old_value == value) {
                        callback(err, res);
                        return;
                    }

                    item[field] = value;

                    let new_callback = (err,res) => {
                        let ok = (err,res) => {callback(err, item);}
                        let payload = { field: field, previous: old_value, new:value, id:_user.id };                        
                        this.createEvent(_user, fullname, payload, err, item, ok);
                    };            

                    this._repository.update(_id, item, new_callback);
                } else {
                    callback({'error': `no such item : ${_id}`}, res);
                }
            }
        });
    }

    setField (_id: string, field: string, value: any, _user:JwtUser, callback: (error: any, result: any) => void) {
        
        this._repository.findById(_id, (err, res) => {
            if (err) {
                callback(err, res);
            } else {
                if (res && res._id) {
                    let item = <Doc>res;

                    if (item[field] == value) {
                        callback(err, res);
                        return;
                    }
                    console.log("about to save");
                    item[field] = value;
                    this._repository.update(res._id, item, callback);
                } else {
                    callback({'error': 'no such item'}, res);
                }
            }
        });
    }


    async delete$(_id: string, _user:JwtUser):Promise<deleteResult> {
        return await this._repository.delete$(_id);
    }


    delete(_id: string, _user:JwtUser, callback: (error: any, result: any) => void) {
        this._repository.delete(_id , callback);
    }

    deleteField(_id: string, field:string, _user:JwtUser, callback:(error: any, result: any) => void) {
        this._repository.deleteField(_id , field, callback);
    }


    async findById$ (_id: string, _populate:string|Array<string> = null):Promise<Doc> {
        let doc = await this._repository.findById$(_id, _populate) as Doc;
        return doc;
    }

    findById (_id: string, callback: (error: any, result: Doc) => void) {
        this._repository.findById(_id, callback);
    }

    findOne (_query: Object, callback: (error: any, result: Doc) => void) {
        this._repository.findOne(_query, callback);
    }

    findQuery (_query: Object, callback: (error: any, result: Doc) => void) {
        this._repository.find(_query, callback);
    }

    findText (_text: string, callback: (error: any, result: Doc) => void) {
        this._repository.findText(_text, callback);
    }

    findName (_text: string, callback: (error: any, result: Doc) => void) {
        this._repository.findName(_text, callback);
    }

    limitedTopQuery (_query: Object, limit: number, criterion: string, callback: (error: any, result: Doc) => void) {
        this._repository.limitedtopfind(_query, limit, criterion, callback);
    }

    limitedfindQuery (_query: Object, limit: number, callback: (error: any, result: Doc) => void) {
        this._repository.limitedfind(_query, limit, callback);
    }
}

export = BaseBusiness;