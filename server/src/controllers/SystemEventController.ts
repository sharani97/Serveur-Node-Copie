/**
 * Created by D. Hockley.
 */


import Business = require('../app/business/SystemEventBusiness');
import BaseController = require('./BaseController');
import IModel = require('../app/model/interfaces/SystemEventModel');

class Controller extends BaseController<IModel, Business> {
}
export = Controller;