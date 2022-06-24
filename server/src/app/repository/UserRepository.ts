/**
 * Created by D. Hockley.
 */

import IModel = require('./../model/interfaces/UserModel');
import Schema = require('./../dataAccess/schemas/UserSchema');
import RepositoryBase = require('./BaseRepository');

class UserRepository  extends RepositoryBase<IModel> {
    constructor () {
        super(Schema, 'points');
    }
}

Object.seal(UserRepository);
export = UserRepository;