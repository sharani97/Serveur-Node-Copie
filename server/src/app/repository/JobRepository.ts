/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/JobModel');
import Schema = require('./../dataAccess/schemas/JobSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;