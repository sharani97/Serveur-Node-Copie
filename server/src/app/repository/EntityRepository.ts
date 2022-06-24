/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/EntityModel');
import Schema = require('./../dataAccess/schemas/EntitySchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema, ['admins','orgadmins']);
    }
}

Object.seal(Repository);
export = Repository;
