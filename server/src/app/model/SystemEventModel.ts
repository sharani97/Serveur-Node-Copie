/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */
import BaseModel = require('./BaseModel');
import IModel = require('./interfaces/SystemEventModel');

class EventModel extends BaseModel<IModel> {

}
Object.seal(EventModel);
export =  EventModel;