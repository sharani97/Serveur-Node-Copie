/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/EpisodeModel');
import Schema = require('./../dataAccess/schemas/EpisodeSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema);
    }
}

Object.seal(Repository);
export = Repository;