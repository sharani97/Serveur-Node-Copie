/**
 * Created by DH
 */

import IModel = require('../model/interfaces/SystemEventModel');
import Schema = require('../dataAccess/schemas/SystemEventSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;