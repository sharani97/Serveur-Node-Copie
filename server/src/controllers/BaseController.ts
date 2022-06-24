/**
 * Created by D. Hockley.
 */
import express = require('express');
import * as errors from '../config/messages/errors';

// import IReadController = require('./interfaces/ReadController');
import IController = require('./interfaces/Controller');
import IBaseBusiness = require('../app/business/common/BaseBusiness');

import JwtUser = require('../app/model/interfaces/JwtUser');

import CoreController = require('./CoreController');

import mongoose = require('mongoose');
import ParameterlessConstructor = require('./interfaces/ParameterlessConstructor');

import Constants = require('../config/constants/constants');

import UserReq = require('../middleware/UserReq')

// const querystring = require('querystring');
/*interface ParameterlessConstructor<T> {
    new (): T;
}*/


class BaseController <Doc extends mongoose.Document, Business extends IBaseBusiness<any>>
                extends CoreController                        
                implements IController<mongoose.Document,IBaseBusiness<any>>
                         {

    public type:string;


    constructor(protected ctor: ParameterlessConstructor<Business>) {
        super();
        // or use es6BindAll (npm)

        this.getNew     = this.getNew.bind(this);
        this.create     = this.create.bind(this);
        this.update     = this.update.bind(this);
        this.delete     = this.delete.bind(this);
        this.deleteField  = this.deleteField.bind(this);
        this.setField   = this.setField.bind(this);
        this.retrieve   = this.retrieve.bind(this);
        this.retrievePage = this.retrievePage.bind(this);
        this.count      = this.count.bind(this);
        this.findById   = this.findById.bind(this);
        this.findQuery  = this.findQuery.bind(this);
        this.findLike   = this.findLike.bind(this);
        this.search     = this.search.bind(this);
        this.searchText = this.searchText.bind(this);
        this.findName   = this.findName.bind(this);
        this.findRange  = this.findRange.bind(this);
        this.findTopLike = this.findTopLike.bind(this);
        this.action     = this.action.bind(this); // this is where a lot of the "non restful" business logic is
        this.sendResult = this.sendResult.bind(this);
        this.requestError = this.requestError.bind(this);
        this.check = this.check.bind(this);
        this.check = this.check.bind(this);
        this.forbiddenError = this.forbiddenError.bind(this);
    }

    getNew() {
        return new this.ctor();
    }

    check(doc:Doc, user:JwtUser, read:Boolean = true) {
        return true;
    }

    filterItem(doc:Doc, user:JwtUser) {
        return true;
    }

    filterItems(docs:Array<Doc>, user:JwtUser) {

        let filteredDocs = docs.filter(doc => this.filterItem(doc, user));
        return filteredDocs
    }

    forbiddenError(req: UserReq.IUserRequest, res: express.Response): void {
        this.requestError(res, errors.FORBIDDEN, 403);
    }
    
    create(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            let doc = <Doc>req.body;
            if (this.check(doc, user)) {
            this.getNew().create( <Doc>req.body, (error: Error, result) => this.sendResult(res, error, result));
             } else {
                 this.requestError(res, errors.FORBIDDEN, 403);
             }

        } catch (e)  {
            this.requestError(res, e);
        }
    }
    update(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let user = req.user;
            let doc = <Doc>req.body;
            if (this.check(doc, user)) {
                this.getNew().update(req.params._id, <Doc>req.body, req.user, (error, result) => this.sendResult(res, error, result));
            } else {
                this.requestError(res, errors.FORBIDDEN, 403);
            }
        } catch (e) {
            this.requestError(res, e);
        }
    }

    setField(req: UserReq.IUserRequest, res: express.Response): void {

        let name = req.params._name;

        if (name == undefined) {
            name = 'UPDATE';
        };
        name = name.toUpperCase();

        try {
            let user = req.user;
            let field = req.params._field;
            let value = req.params._value;
            let business = this.getNew();
            let update = (error, doc) => {
                if (this.check(doc, user)) {

                    business.setFieldAndLog(req.params._id, req.params._field,
                                            req.params._value, name, req.user,
                                            (error, result)  => this.sendResult(res, error, result)
                                        );
                } else {
                    this.requestError(res, errors.FORBIDDEN, 403);
                }
            }

            business.findById(req.params._id, update);

        } catch (e)  {
            this.requestError(res, e);
        }
    }

    action(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            this.getNew().action(req.params._id, req.params._action, req.body, req.user, (error, result) => {
                this.sendResult(res, error, result);
            });
        } catch (e)  {
            this.requestError(res, e);
        }
    }


    delete(req: UserReq.IUserRequest, res: express.Response): void {
        try {

            let business = this.getNew()
            business.findById$(req.params._id).then((doc) => {
                if (this.check(doc, req.user)) {
                    business.delete$(req.params._id, req.user).then(() => {
                        this.sendResult(res, null, null);
                    }).catch(e => {
                        this.requestError(res, e);
                    })
                } else {
                    throw new Error(errors.FORBIDDEN);
                }

            }).catch(e => {
                this.requestError(res, e);
            })
            //this.getNew().delete(req.params._id, req.user, (error, result) => this.sendResult(res, error, result));
        } catch (e)  {
            this.requestError(res, e);
        }
    }

    deleteField(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            this.getNew().deleteField(req.params._id, req.params._field, req.user, (error, result)  => this.sendResult(res, error, result));
        } catch (e)  {
            this.requestError(res, e);
        }
    }

    retrieve(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            this.getNew().retrieve((error, result) =>  {
                // console.log("result" , result, error);
                return this.sendResult(res, error, this.filterItems(result as Array<Doc>, req.user));
            });
        } catch (e)  {
            this.requestError(res, e);
        }
    }

    count(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            this.getNew().count((error, result) => this.sendResult(res, error, {'count': result}));
        } catch (e)  {
            this.requestError(res, e);
        }
    }


    retrievePage(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let _n: number = parseInt(req.params._page, 10) || 1;
            let _size: number =  parseInt(req.params._pagesize,10) || 20;
            this.getNew().retrievePage(_n, _size, (error, result) => this.sendResult(res, error, result));
        } catch (e)  {
            this.requestError(res, e);
        }
    }
    findById(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            this.getNew().findById(req.params._id, (error, result) => this.sendResult(res, error, result));
        } catch (e)  {
            this.requestError(res, e);
        }
    }


    findTopLike(req: UserReq.IUserRequest, res: express.Response): void {
        try {

            let _param: string = req.params._param;
            let _criterion: string = req.params._criterion;
            let _limit: number = parseInt(req.params._limit, 10);
            let _value: string = req.params._value.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');
            let _regex: RegExp =  new RegExp(_value, 'i');
            let _query = {};

            if (_value === '') {
                res.send({'error': errors.MISSING_PARAMETER_VALUE.concat(_param)});
                return;
            }

            _query[_param] = _regex;
            this.getNew().limitedTopQuery(_query, _limit, _criterion, (error, result) => this.sendResult(res, error, result));

        } catch (e)  {
            this.requestError(res, e);
        }
    }

    findQuery(req: UserReq.IUserRequest, res: express.Response): void {
        try {

            let _query = {};
            // if date
            let _date: string = req.params._date;
            let _param: string = req.params._param;
            let _value = req.params._value;
    
            if ((_param != undefined) &&(_value != undefined)){
                _query[_param] = _value;
            }

            if (_date != undefined) {
                _query["updated"] = {$gt:_date};
            }

            this.getNew().findQuery(_query, (error, result) => this.sendResult(res, error, result));
        } catch (e)  {
            this.requestError(res, e);
        }
    }

    findRange(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            let _query = {
                [req.params._param] :  {$gte: req.params._value0, $lt: req.params._value1}
            };
            this.getNew().findQuery(_query, (error, result) => this.sendResult(res, error, result));

        } catch (e)  {
            this.requestError(res, e);
        }
    }


    findName(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            this.getNew().findName(req.params._name, (error, result) => this.sendResult(res, error, result));
        } catch (e)  {
            this.requestError(res, e);
        }
    }

    searchText(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            this.getNew().findText(req.params._text, (error, result) => this.sendResult(res, error, result));
        } catch (e)  {
            this.requestError(res, e);
        }
    }


     search(req: UserReq.IUserRequest, res: express.Response): void {
        try {

            let query = {};
            let limit = -1;

            for (let param in req.query) {
                if (req.query.hasOwnProperty(param)) {

                    // like, in, likein ? = is param special?
                    let like = false;
                    let find_in = false;
                    let _value = req.query[param];
                    let p = param.split(':');
                    if (p.length > 1) {
                        param = p[0];
                        for (let i = 1; i < p.length; i++) {
                            let search_type = p[i];
                            // manage lt & gt ?
                            if (search_type === 'in') {
                                find_in = true;
                            }
                            if (search_type === 'like') {
                                like = true;
                            }
                        }
                    }

                    if (typeof _value == "string") {
                      if (param === 'limit') {
                          limit = parseInt(_value, 10);
                      } else {
                          if (find_in) {
                              let _values: Array<string>|Array<RegExp>;
                              if (like) {
                                  _values = _value.split(',').map(function(val) {
                                      let r = val.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&'); // santize
                                      return new RegExp(r, 'i');
                                  }) ;
                              } else {
                                  _values = _value.split(',');
                              }

                              if (_values.length > 0) {
                              query[param] = {
                                  $in : _values
                              };
                              } else {
                                  query[param] = _values[0];
                              }
                          } else {
                              if (like) {
                                  query[param] = new RegExp(_value.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&'), 'i'); // santize
                              } else {
                                  query[param] = _value;
                              }
                          }
                      }
                    }
                }
            }

            let business: Business = this.getNew();
            if (limit === -1) {
                business.findQuery(query, (error, result) => this.sendResult(res, error, result));
            } else {
                business.limitedfindQuery(query, limit, (error, result) => this.sendResult(res, error, result));
            }
        } catch (e)  {
            this.requestError(res, e);
        }
    }

    findLike(req: UserReq.IUserRequest, res: express.Response): void {
        try {
            const _param: string = req.params._param;
            const _value: string = req.params._value.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&'); // santize

            if (_value === '') {
                res.send({'error': errors.MISSING_PARAMETER_VALUE.concat(_param)});
                return;
            }

            let _values = _value.split(',').map((val) => new RegExp(val, 'i'));

            let _param2: string = req.params._param2;
            let _value2: string = req.params._value2;

            let _query = {};
            if (_values.length > 1) {
               _query[_param] = { $in : _values};
            } else {
                _query[_param] = _values[0];
            }

           if (_value2) {
                let _values2 = _value2.split(',');
                if (_values2.length > 1) {
                    _query[_param2] = {$in : _values2};
                } else {
                    _query[_param2] = _value2;
                }
            }

            this.getNew().findQuery(_query, (error, result) => this.sendResult(res, error, result));
        } catch (e)  {
            this.requestError(res, e);
        }
    }


}
export = BaseController;