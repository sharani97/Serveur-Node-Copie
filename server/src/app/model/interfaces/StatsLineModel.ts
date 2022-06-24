/**
 * Created by D. Hockley.
 */

import ItemModel = require('./ItemModel');

interface StatsLineModel extends ItemModel {
    target_type: string; // enum mission, idea, .. ?
    target_id:string, // i.e. the thing being bought 
    date: string, // YYYYMMDD 
    data: {[key:string]:number}
}

export = StatsLineModel;
