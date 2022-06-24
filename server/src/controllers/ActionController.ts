/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */


import Business = require('./../app/business/ActionBusiness');
import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/ActionModel');

class Controller extends BaseController<IModel, Business> {
}
export = Controller;