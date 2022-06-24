/**
 * Created by D. Hockley.
 */

import ContentModel = require('./ContentModel');
import Url = require('./Url');

interface IdeaModel extends ContentModel {
    mission_id:string;
    original:string;
    original_creator:string;
    phase:number;
    price:number;
    active:Boolean;
}

export = IdeaModel;
