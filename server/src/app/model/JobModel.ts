/**
 * Created by D. Hockley.
 */
import BaseModel = require('./BaseModel');
import IModel = require('./interfaces/JobModel');

class JobModel extends BaseModel<IModel> {
}
Object.seal(JobModel);
export =  JobModel;