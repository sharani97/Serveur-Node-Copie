/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */
import BaseModel = require('./BaseModel')
import IModel = require('./interfaces/OrganizationModel');

class Model extends BaseModel<IModel> {
}

Object.seal(Model);
export =  Model;
