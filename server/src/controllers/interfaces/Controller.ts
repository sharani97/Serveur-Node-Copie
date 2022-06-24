/**
 * Created by D. Hockley.
 */

import IReadController = require('./ReadController');
import IWriteController = require('./WriteController');
import IBaseBusiness = require('../../app/business/common/BaseBusiness');
import mongoose = require('mongoose');

interface Controller< Doc extends mongoose.Document, T extends IBaseBusiness<Object>> extends IReadController, IWriteController{
    type:string; 
}

export = Controller;