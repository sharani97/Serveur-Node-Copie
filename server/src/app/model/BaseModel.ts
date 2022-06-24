/**
 * Created by D. Hockley.
 */

import mongoose = require('mongoose');

class BaseModel<Doc extends mongoose.Document> {

    protected _model: Doc;

    constructor(doc: Doc) {
        this._model = doc;
    }

}

export =  BaseModel;