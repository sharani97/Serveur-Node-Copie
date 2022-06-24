/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import ItemModel = require('./ItemModel')

interface OrgItemModel extends ItemModel {
    org: string
}

export = OrgItemModel;