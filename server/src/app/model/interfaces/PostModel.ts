/**
 *
 */

import ContentModel = require('./ContentModel');
import Url = require('./Url');

interface PostModel extends ContentModel {
    target_ids: [string];
    target_type: string;
}

export = PostModel;
