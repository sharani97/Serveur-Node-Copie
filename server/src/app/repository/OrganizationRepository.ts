/**
 * Created by DH
 */

import IModel = require('./../model/interfaces/OrganizationModel');
import Schema = require('./../dataAccess/schemas/OrganizationSchema');
import RepositoryBase = require('./BaseRepository');

class Repository extends RepositoryBase<IModel> {
    constructor () {
        super(Schema, ['groups','admins','entity'], ['name', 'id']);
    }
}

Object.seal(Repository);
export = Repository;
