/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */
import BaseModel = require('./BaseModel');
import IModel = require('./interfaces/MessagePageModel');

class MessagePageModel extends BaseModel<IModel> {

}
Object.seal(MessagePageModel);
export =  MessagePageModel;