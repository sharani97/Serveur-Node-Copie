/**
 * Created by D. Hockley.
 */

import BaseModel = require('./BaseModel')
import IUserModel = require('./interfaces/UserModel');

class UserModel extends BaseModel<IUserModel> {

    /*
        name: string;
        email: string;
        token: string;
        auth_type: string;
        roles: Array<string>;
    */

    get name (): string {
        return this._model.name || this._model.username;
    }

    get username (): string {
        return this._model.username;
    }

    get email (): string {
        return this._model.email;
    }

    get google_id (): string {
        return this._model.google_id;
    }

    get token (): string {
        return this._model.token;
    }

    get roles (): string[] {
        return this._model.roles;
    }

    get auth_type (): string {
        return this._model.auth_type;
    }

    get id (): string {
        return this._model.id;
    }

    get _id (): string {
        return this._model._id;
    }

}

Object.seal(UserModel);
export =  UserModel;