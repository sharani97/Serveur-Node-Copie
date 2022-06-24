//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../../server').app;
let should = chai.should();

import User = require('../../app/dataAccess/schemas/UserSchema');
import UserModel = require('../../app/model/UserModel');
import * as shared from './shared';


chai.use(chaiHttp);
//Our parent block
describe('Test Item REST methods', () => {
    /*beforeEach((done) => { //Before each test we empty the database
        User.remove ({}, (err) => {
           done();
        });
    });*/
/*
  * Test the /GET route
  */

    describe('/GET TestItems', () => {
        it('it should GET all test items', (done) => {
        chai.request(server)
            .get('/api/testitems')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                done();
            });
        });
    });



});