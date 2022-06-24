/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/CommentModel');
import Schema = require('./../dataAccess/schemas/CommentSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;