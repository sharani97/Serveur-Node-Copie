/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/MessagePageModel');
import Schema = require('./../dataAccess/schemas/MessagePageSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;