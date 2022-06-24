/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import ItemModel = require('./OrgItemModel')

interface EventModel extends ItemModel {
    type: string;
    creator_id: string;
    target: string;
    target_type:string;
    payload: Object;
}

export = EventModel;