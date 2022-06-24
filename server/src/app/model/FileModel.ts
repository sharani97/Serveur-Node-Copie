/**
 * Created by D. Hockley.
 */
import BaseModel = require('./BaseModel');
import IModel = require('./interfaces/FileModel');

class FileModel extends BaseModel<IModel> {
}
Object.seal(FileModel);
export =  FileModel;