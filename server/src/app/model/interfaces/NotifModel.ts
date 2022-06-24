/**
 * Created by Moiz.Kachwala on 15-06-2016.
 */

import ItemModel = require('./ItemModel')

interface NotifModel extends ItemModel {

    date:   Date; // date it was or will be sent ?
    org:  string;
    creator_id: string;
    type:  string;
    state: string;
    text: string;
    read: boolean;
    nb:     number;
    uri:    string;
    rooturi:string;
    payload: Object;
    target:  string; // ie. target user 
    subject:  string;
    res: string;
}

export = NotifModel;