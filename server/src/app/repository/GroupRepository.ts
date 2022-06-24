/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/GroupModel');
import Schema = require('./../dataAccess/schemas/GroupSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;
