/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/SeriesModel');
import Schema = require('./../dataAccess/schemas/SeriesSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;