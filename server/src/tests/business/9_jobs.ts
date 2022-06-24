//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../../server').app;
let should = chai.should();

import * as shared from './shared';

import Job = require('../../app/dataAccess/schemas/JobSchema');
import JobModel = require('../../app/model/JobModel');

chai.use(chaiHttp);
//Our parent block
describe('Job', () => {
    beforeEach((done) => { //Before each test we empty the database
        //Job.remove ({}, (err) => {
           done();
        //});
    });
/*
  * Test the /GET route
  */
  describe('/GET Jobs', () => {
      it( 'GET all the jobs @files', (done) => {
        chai.request(server)
            .get('/api/jobs')
            .set('x-access-token', shared.tokens.jwt)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(18);
              done();
            });
      });
  });

});