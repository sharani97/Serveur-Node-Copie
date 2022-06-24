/**
 * Created by D. Hockley.
 */


import Business = require('./../app/business/EpisodeBusiness');
import BaseController = require('./BaseController');
import IModel = require('./../app/model/interfaces/JobModel');

class Controller extends BaseController<IModel, Business> {
}
export = Controller;