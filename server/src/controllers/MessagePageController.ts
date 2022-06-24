/**
 * Created by D. Hockley.
 */


import Business = require('./../app/business/MessagePageBusiness');
import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/MessagePageModel');

class Controller extends BaseController<IModel, Business> {
}
export = Controller;