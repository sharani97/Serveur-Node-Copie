import mongoose = require('mongoose');
import TextModel = require('./TextModel');
import Url = require('./Url');

interface ContentModel extends TextModel {
    creator_id: string;
    title:string; 
    description: string;
    image: string;
    image_url: string;
    url:string;
    urldata: Url;
}


export = ContentModel;
