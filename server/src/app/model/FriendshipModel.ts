/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */
import BaseModel = require('./BaseModel');
import IModel = require('./interfaces/FriendshipModel');

class FriendshipModel extends BaseModel<IModel> {

}
Object.seal(FriendshipModel);
export =  FriendshipModel;