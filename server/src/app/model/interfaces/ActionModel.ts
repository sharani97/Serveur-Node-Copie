/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import mongoose = require('mongoose');

interface ActionModel extends mongoose.Document {
    id:   string;
    date:   Date;
    email:  string;
    state:  string;
    type:  string;
    company_id: string;
    properties: string[]
    action: string;

}

export = ActionModel;