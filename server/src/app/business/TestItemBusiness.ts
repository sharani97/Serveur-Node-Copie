/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import Repository = require('./../repository/TestItemRepository');
import IBusiness = require('./common/BaseBusiness');
//import IModel = require('./../model/interfaces/TestItemModel');
import { TestItem as IModel} from '../model/TestItem';

import BaseBusiness = require('./BaseBusiness');
import EventFactory = require ('../model/events/SystemEventFactory');

class Business extends BaseBusiness<IModel, Repository, EventFactory<IModel>> implements IBusiness<IModel> {

    init(): Repository {
        this._type = 'testitems';
        this._factory = new EventFactory<IModel>();
        return new Repository();
    }
}

Object.seal(Business);
export = Business;
