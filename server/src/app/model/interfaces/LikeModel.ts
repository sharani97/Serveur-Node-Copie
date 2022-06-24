/**
 * Created by D. Hockley.
 */

import ItemModel = require('./ItemModel');

interface LikeModel extends ItemModel {

    user_id: string;
    target_id: string;
    target_type: string; 
    meaning: string;
    nb: number;
}

export = LikeModel;
