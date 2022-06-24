let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../../server').app;
let server_setup = require('../../server').setup;


//let should = chai.should();
import { expect } from 'chai';

import * as mocha from 'mocha';
// import * as mocha from 'mocha';

import * as shared from './shared'

import randomstring = require('randomstring');
import bcrypt = require('bcrypt');

import Org   = require('../../app/dataAccess/schemas/OrganizationSchema');
import Group = require('../../app/dataAccess/schemas/GroupSchema');
import Job   = require('../../app/dataAccess/schemas/JobSchema');

import Post = require('../../app/dataAccess/schemas/PostSchema');

import User   = require('../../app/dataAccess/schemas/UserSchema');
import Conversation   = require('../../app/dataAccess/schemas/ConversationSchema');
import MessagePage   = require('../../app/dataAccess/schemas/MessagePageSchema');

import Notif = require('../../app/dataAccess/schemas/NotifSchema')

import Points = require('../../app/dataAccess/schemas/PointsSchema');

import Series = require('../../app/dataAccess/schemas/SeriesSchema');
import Episodes = require('../../app/dataAccess/schemas/EpisodeSchema');

import PointsModel = require('../../app/model/interfaces/PointsModel');
import * as reward from '../../config/constants/rewards';

import UserModel = require('../../app/model/UserModel');

import Entity = require('../../app/dataAccess/schemas/EntitySchema');
import { CoreUtilities } from '../../app/utilities/CoreUtilities';
//import EntityModel = require('../../app/model/EntityModel');


//let jwt:string;

// console.log(Date.now());
// 1511680354200

let originalDateNow;

function mockDateNow() {
    // mock now = 1462361249717ms = 4th May 2016
    return 1511680354200;
 }

//Date helper function
function getDayMonth(ms) {
    const dt = new Date(ms);
    const monthNames = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                         'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (dt.getDate()  + ' ' + monthNames[dt.getMonth()]);
 }

let token:string;

mocha.before(async function () { //Before starting we create an admin user
    
    this.timeout(15000);
    await server_setup();
    await User.remove({}).exec();
    await Org.remove({}).exec();
    await Points.remove({}).exec();
    await Group.remove({}).exec();
    await Job.remove({}).exec();
    await Entity.remove({}).exec();
    await MessagePage.remove({}).exec();
    await Conversation.remove({}).exec();
    await Post.remove({}).exec();
    await Notif.remove({}).exec();
    await Episodes.remove({}).exec();
    await Series.remove({}).exec();

    let newUser = new User(shared.userData);
    await newUser.save();

    let karma = new Points({
        user:newUser._id,
        cat:reward.KARMA, 
        amount: reward.DEFAULTS[reward.KARMA],
        primary:true 
    });

    await karma.save();

    shared.users.admin = newUser;
    let result = await chai.request(server).post('/api/password').send(shared.login_user);
    shared.tokens.jwt = result.body.data.jwt;
    shared.users.admin = result.body.data;
    let orgdata = new Org(shared.generalOrg);
    let org = await orgdata.save();
    shared.tokens.general_org_id = org._id;

});

function getToday() {
    return Date.now();
}

function _idtoB64(id) {
    return CoreUtilities.objectIdToBase64(id);
}

function B64to_id(b64) {
    return CoreUtilities.base64ToObjectId(b64);
}

var id = require('mongoose').Types.ObjectId();

describe('Mocking Date Now', function() {

    beforeEach(function () {
        originalDateNow = Date.now;
        Date.now = mockDateNow;
    });

    afterEach(function () {
        Date.now = originalDateNow;
    });

    describe('Date functions', function () {
        it('should return today\'s mock date', function () {
            expect(getDayMonth(getToday())).to.equal('26 Nov');
        });
    });

    describe('Mongoose 2 b64', function () {
        it('should convert object id to b64 and back', function () {
            expect(B64to_id(_idtoB64(id)).equals(id)).to.equal(true);
        });
    });

});