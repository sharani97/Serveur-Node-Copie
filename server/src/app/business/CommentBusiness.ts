/**
 * Created by D. Hockley.
 */

import Repository = require('./../repository/CommentRepository');
import IBusiness = require('./common/BaseBusiness');
import IModel = require('./../model/interfaces/CommentModel');
import BaseBusiness = require('./BaseBusiness');
import SystemEventFactory = require ('./../model/events/SystemEventFactory')
class Business extends BaseBusiness<IModel, Repository, SystemEventFactory<IModel>> implements IBusiness<IModel> {

    init(): Repository {
        this._name = 'Comment business';
        this._type = 'comments';
        this._factory = new SystemEventFactory<IModel>();
        return new Repository();
    }
}


Object.seal(Business);
export = Business;