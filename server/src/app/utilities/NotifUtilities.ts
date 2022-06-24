import JwtUser = require('../model/interfaces/JwtUser');

import Notif = require('./../dataAccess/schemas/NotifSchema');

import mongoose = require('mongoose');
import { CustomError }  from '../shared/customerror';

import * as notifs from '../../config/constants/notiftypes';
import * as errors from '../../config/messages/errors';
import { ObjectID } from 'bson';


export class NotifUtilities {

    // true = you were right to doubt its validity, false == no, its is truly valid
    public static async checkNotifValidity$(id:ObjectID):Promise<boolean> {

        let notif = await Notif.findById(id).exec();
        if (notif == null) {
            return true;
        }


        let uri = notif.uri;
        if (uri == undefined) {
            await notif.remove();
            return true;
        }



        return false;
    }

    public static async checkNotifsValidity$(ids:Array<ObjectID>):Promise<Array<boolean>> {

        let ret:boolean[] = [];

        for (let id of ids) {
            ret.push(await NotifUtilities.checkNotifValidity$(id));
        }

        return ret;
    }


}