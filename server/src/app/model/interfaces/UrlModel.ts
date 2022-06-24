/**
 * Created by D. Hockley.
 */

import mongoose = require('mongoose');

interface UrlModel extends mongoose.Document {
    link: string;
    image: string;
    title: number;
    desc:string;
    site: string;
    img_width:number;
    img_height:number; 
}

export = UrlModel;
