/**
 * Created by D. Hockley.
 */

import Repository = require('./../repository/UserRepository');
import IModel = require('./../model/interfaces/UserModel');
import BaseBusiness = require('./BaseBusiness');
import bcrypt     = require('bcrypt');
import IBusiness = require('./common/BaseBusiness');
import SystemEventFactory = require ('./../model/events/SystemEventFactory');

class UserBusiness extends BaseBusiness<IModel, Repository, SystemEventFactory<IModel>> implements IBusiness<IModel> { // implements IBusiness

    init(): Repository {
        this._type = 'users';
        this._factory = new SystemEventFactory<IModel>();
        return new Repository();
    }

    updatePassword(_email: string, _pass: string, callback: (error: any, result: any) => void) {

        this._repository.findOne({email:_email}, (err, res) => {
            if (err) {
                callback(err, res);
            } else {
                this._repository.updateField(res._id, 'token', bcrypt.hashSync(_pass), callback);
            }
        });
    }

    updateUserPassword(_id: string, _pass: string, callback: (error: any, result: any) => void) {

        this._repository.findById(_id, (err, res) => {
            if (err) {
                callback(err, res);
            } else {
                this._repository.updateField(res._id, 'token', bcrypt.hashSync(_pass), callback);
            }
        });
    }

    findByGoogleId (gid: string, callback: (error: any, result: IModel) => void) {
        this._repository.findOne({google_id:gid}, callback);
    }

}


Object.seal(UserBusiness);
export = UserBusiness;