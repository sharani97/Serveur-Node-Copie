/**
 * Created by D. Hockley.
 */

import IRead = require('./interfaces/Read');
import IWrite = require('./interfaces/Write');
// import IHeroModel = require('./../model/interfaces/HeroModel');

import mongoose = require('mongoose');
import { Callback, Document } from 'mongoose';

import { deleteResult} from '../shared/deleteResult';


class RepositoryBase<T extends mongoose.Document> implements IRead<T>, IWrite<T> {

    protected _model: mongoose.Model<mongoose.Document>;
    protected _searchLimit = -1;

    // _populateQuery is a query used to populate the populatable fields (no shit, sherlock). See SchemaModels
    constructor (
            schemaModel: mongoose.Model<mongoose.Document>,
            protected _populateQuery: string | string[] = null,
            protected _names = ['name']) {
        this._model = schemaModel;
    }

    create (item: T, callback: (error: any, result: any) => void) {
        this._model.create(item, callback);
    }

    count (callback: (error: any, result: any) => void) {
        this._model.count({}).exec(callback);
    }


    retrieve (callback: (error: any, result: any) => void) {

        if (this._populateQuery) {
            this._model.find({}).populate(this._populateQuery).exec(callback);
        } else {
            this._model.find({}, callback);
        }
    }

    retrievePage (n: number, pagesize: number, callback: (error: any, result: any) => void) {

        if (this._populateQuery) {
            this._model.find({}).skip(pagesize * (n - 1)).limit(pagesize).populate(this._populateQuery).exec(callback);
        } else {
            this._model.find({}).skip(pagesize * (n - 1)).limit(pagesize).exec(callback);
        }
    }


    async update$ (_id: string, item: T): Promise<any>  {
        let res = await this._model.updateOne({_id: this.toObjectId(_id)}, item).exec();
    }

    update (_id: string, item: T, callback: (error: any, result: any) => void) {
        this._model.updateOne({_id: this.toObjectId(_id)}, item, callback);
    }

    updateFields (_id: string, data:Object, callback: (error: any, result: any)=> void) {
        this._model.updateOne({_id: this.toObjectId(_id)}, data, callback);
    }


    updateField (_id: string, _fieldName: string, _value: any, callback: (error: any, result: any)=> void) {
        this._model.findById(_id, (err, doc) => {
            doc[_fieldName] = _value;
            doc.save(callback);
        });
    }


    async delete$ (_id:string):Promise<deleteResult>  {
        return await this._model.remove({_id: this.toObjectId(_id)}).exec();
    }

    delete (_id: string, callback: (error: any, result: any) => void) {
        this._model.remove({_id: this.toObjectId(_id)}, (err) => callback(err, null));
    }

    deleteField(_id: string, _fieldName: string, callback: (error: any, result: any) => void) {
        this._model.findById(_id, (err, doc) => {
            doc.set(_fieldName, undefined);
            doc.save(callback);
        });
    }

    async findById$(_id: string, _populate:string|string[] = null):Promise<mongoose.Document> {

        if (_populate == null) {
            _populate = this._populateQuery;
        }

        if (_populate) {
          return await this._model.findById(_id).populate(_populate).exec();
        } else {
          return await this._model.findById(_id).exec();
        }
    }


    findById (_id: string, callback) {
        if (this._populateQuery) {
          this._model.findById(_id).populate(this._populateQuery).exec(callback);
        } else {
          this._model.findById(_id, callback);
        }
    }

    findOne (_query: Object, callback) {
        if (this._populateQuery) {
            this._model.findOne(_query).populate(this._populateQuery).exec(callback);
        } else {
            this._model.findOne( _query, callback);
        }
    }

    find (_query: Object, callback) {
        if (this._populateQuery) {
            this._model.find(_query).populate(this._populateQuery).exec(callback);
        } else {
            this._model.find( _query, callback);
        }
    }

    findText(_text: string, callback) {


        let _query = {$text : {$search: _text}};
        let _s = { score : { $meta: 'textScore' }};

        if (this._populateQuery) {
            //@ts-ignore
            this._model.find(_query, _s).sort(_s).populate(this._populateQuery).exec(callback);
        } else {
            //@ts-ignore
            this._model.find(_query, _s).sort(_s).exec(callback);
        }
    }

   findName(_text: string, callback) {

        let _query = [];


       // split _text into words
        let bits = _text.split(' ');

        // make a regex to match one of the word starts (hence the \b)
        let search = bits.map(t => '\\b' + t).join('\(.*?\)');
        let re: RegExp = new RegExp(search, 'i');

        for (let name of this._names) {
            let o = new Object;
            o[name] = re;
            _query.push(o);
        }

        if (this._populateQuery) {
            this._model.find().or(_query).populate(this._populateQuery).exec(callback);
        } else {
            this._model.find().or(_query).exec(callback);
        }
    }

    limitedtopfind(_query: Object, limit: number, criterion: string, callback) {
        if (this._populateQuery) {
            this._model.find(_query).sort('-' + criterion).limit(limit).populate(this._populateQuery).exec(callback);
        } else {
            this._model.find( _query).sort('-' + criterion).limit(limit).exec(callback);
        }
    }


    limitedfind (_query: Object, limit: number, callback) {
        if (this._populateQuery) {
            this._model.find(_query).sort('_id').limit(limit).populate(this._populateQuery).exec(callback);
        } else {
            this._model.find( _query).sort('_id').limit(limit).exec(callback);
        }
    }

    findByItemId (mmid: string,  callback) {
        this.findOne( {id: mmid}, callback);
    }

    private toObjectId (_id: string): mongoose.Types.ObjectId {
        return new mongoose.Types.ObjectId(_id);
    }

}

export = RepositoryBase;