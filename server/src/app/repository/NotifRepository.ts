/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/NotifModel');
import Schema = require('./../dataAccess/schemas/NotifSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;