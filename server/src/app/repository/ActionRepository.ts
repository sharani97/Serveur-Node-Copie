/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/ActionModel');
import Schema = require('./../dataAccess/schemas/ActionSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;