/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/ConversationModel');
import Schema = require('./../dataAccess/schemas/ConversationSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;