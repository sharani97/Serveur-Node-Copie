/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/LikeModel');
import Schema = require('./../dataAccess/schemas/LikeSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;