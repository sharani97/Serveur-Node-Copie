let mongoose = require('../../mock/mongoose');

//import BaseBusiness = require('../../app/business/BaseBusiness');
import * as mocha from 'mocha';

import Job   = require('../../app/dataAccess/schemas/JobSchema');
import Notif   = require('../../app/dataAccess/schemas/NotifSchema');

import Constants = require('./../../config/constants/constants');

import { expect } from 'chai';
let config = require('config');


describe("Meta Tests", function() {

    beforeEach(async () => {
        await Job.remove({}).exec();
        await Notif.remove({}).exec();
    });

    it("should always pass given that it is empty", function(done) {

        expect(true).to.equal(true);
        done();

    });

    it("DB should be test", function(done) {
        let MONGO_URI = process.env.MONGO_URI ||'localhost';
        expect(Constants.DB_CONNECTION_STRING).to.equal(`mongodb://${MONGO_URI}:27017/testDB`);
        done();
    });

    it("environment should be test", function(done) {
        expect(config.util.getEnv('NODE_ENV')).to.equal("test");
        done();
    });

});





