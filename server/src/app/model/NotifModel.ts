/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */
import BaseModel = require('./BaseModel');
import IModel = require('./interfaces/NotifModel');

class NotifModel extends BaseModel<IModel> {

}
Object.seal(NotifModel);
export =  NotifModel;