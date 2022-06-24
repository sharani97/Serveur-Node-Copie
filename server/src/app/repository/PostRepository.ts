/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/PostModel');
import Schema = require('./../dataAccess/schemas/PostSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;