/**
 * Created by D. Hockley.
 */
import BaseModel = require('./BaseModel');
import IModel = require('./interfaces/PostModel');

class PostModel extends BaseModel<IModel> {
}
Object.seal(PostModel);
export =  PostModel;