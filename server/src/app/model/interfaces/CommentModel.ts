/**
 *
 */

import ItemModel = require('./ItemModel');
import Url = require('./Url');

interface CommentModel extends ItemModel {
    creator_id:  string;
    target_id:   string;
    target_type: string;
    title:       string;
    description: string;
    suggest:     boolean;
    image_url:   string;
    url:         string;
    urldata:     Url;
    // comment:  string; // ? really
}

export = CommentModel;
