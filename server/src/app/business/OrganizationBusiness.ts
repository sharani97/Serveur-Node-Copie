/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import Repository = require('./../repository/OrganizationRepository');
import IBusiness = require('./common/BaseBusiness');
import IModel = require('./../model/interfaces/OrganizationModel');
import BaseBusiness = require('./BaseBusiness');
import SystemEventFactory = require ('./../model/events/SystemEventFactory');
class Business extends BaseBusiness<IModel, Repository, SystemEventFactory<IModel>> implements IBusiness<IModel> {

    init(): Repository {
        this._type = 'organizations';
        this._factory = new SystemEventFactory<IModel>();
        return new Repository();
    }
}


Object.seal(Business);
export = Business;
