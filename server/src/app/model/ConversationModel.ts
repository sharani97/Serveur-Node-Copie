/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */
import BaseModel = require('./BaseModel');
import IModel = require('./interfaces/ConversationModel');

class ConversationModel extends BaseModel<IModel> {
    

}
Object.seal(ConversationModel);
export =  ConversationModel;