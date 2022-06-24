/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/UrlModel');
import Schema = require('./../dataAccess/schemas/UrlSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;