/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */
import BaseModel = require('./BaseModel')
import ICommentModel = require('./interfaces/CommentModel');

class CommentModel extends BaseModel<ICommentModel> {

}
Object.seal(CommentModel);
export =  CommentModel;
