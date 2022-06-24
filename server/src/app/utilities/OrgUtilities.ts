import JwtUser = require('../model/interfaces/JwtUser');

import Org = require('./../dataAccess/schemas/OrganizationSchema');
import OrgModel = require('./../model/interfaces/OrganizationModel')
import mongoose = require('mongoose');
import { CustomError }  from '../shared/customerror';

import * as errors from '../../config/messages/errors';

export class OrgUtilities {

    public static async checkOrgSettings(org:OrgModel):Promise<OrgModel> {

        let config = require('config');

        let dirty = false;

        let _settings = config.get('settings');

        if (org.settings == undefined) {
            org.settings = _settings;
            dirty = true;
        }


        for (let key in _settings) {
            if (org.settings[key] == undefined) {
                org.settings[key] = _settings[key];
                dirty = true;
            }
        }

        if (dirty) {
            await org.save();
        }

        return org;
    }


}