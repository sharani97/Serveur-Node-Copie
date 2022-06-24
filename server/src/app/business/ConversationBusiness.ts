/**
 * Created by D. Hockley.
 */

import Repository = require('./../repository/ConversationRepository');
import IBusiness = require('./common/BaseBusiness');
import IModel = require('./../model/interfaces/ConversationModel');
import BaseBusiness = require('./BaseBusiness');
import SystemEventFactory = require ('./../model/events/SystemEventFactory')
class Business extends BaseBusiness<IModel, Repository, SystemEventFactory<IModel>> implements IBusiness<IModel> {

    init(): Repository {
        this._name = 'MessagePage business';
        this._type = 'messagepages';
        this._factory = new SystemEventFactory<IModel>();
        return new Repository();
    }
}


Object.seal(Business);
export = Business;