/**
 * Created by D. Hockley.
 */
import BaseModel = require('./BaseModel');
import IModel = require('./interfaces/StatsLineModel');

class StatsLineModel extends BaseModel<IModel> {
}
Object.seal(StatsLineModel);
export =  StatsLineModel;