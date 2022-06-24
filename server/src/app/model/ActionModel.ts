/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */
import BaseModel = require('./BaseModel');
import IActionModel = require('./interfaces/ActionModel');

class ActionModel extends BaseModel<IActionModel> {

}
Object.seal(ActionModel);
export =  ActionModel;