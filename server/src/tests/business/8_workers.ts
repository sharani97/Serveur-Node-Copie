//Require the dev-dependencies
let chai = require('chai');
let like = require('chai-like');

let chaiHttp = require('chai-http');
let server = require('../../server').app;
let should = chai.should();

import * as mocha from 'mocha';
import * as shared from './shared';

import randomstring = require('randomstring');
import bcrypt = require('bcrypt');
import User   = require('../../app/dataAccess/schemas/UserSchema');
import UserModel = require('../../app/model/UserModel');

chai.use(like);
chai.use(chaiHttp);

//Our parent block
describe('Workers', function() {

    /*
    it('uploading a csv file fails without rights (if synchronous task)', function(done) {
        chai.request(server)
            .post('/api/upload/csv/')
            .set('x-access-token', shared.tokens.test_user_jwt)
            //.field('Content-Type', 'multipart/form-data')
            //.attach('image', 'path/to/image.jpg', 'image.jpg')
            //.type('form')
            .field('type', 'batch_invite')
            .field('group',shared.tokens.group_id1)
            .attach('file', './test/invites.csv')
            .timeout(20000)
            .end(function(err, res) {
                res.should.have.status(403); // 'success' status
                res.body.should.be.like({'error':'error.access_forbidden'})
                done();
            });
    });*/

    
    // todo plug back in 
    /*
    it('upload an img file', function(done) {
        chai.request(server)
            .post('/api/upload/image/')
            .set('x-access-token', shared.tokens.jwt)
            .attach('file', './test/test.jpg')
            .timeout(20000)
            .end(function(err, res) {
                res.should.have.status(200); // 'success' status
                res.body.should.have.property("_id"); // 'success' status
                let id = res.body._id;
                res.body.should.be.like({
                    _id: id,
                    //url:`/images/${id}.jpg`
                });
                done();
            });
    });
    */


   it('gets a signed url', function(done) {
    chai.request(server)
        .post('/api/upload/signedurl/')
        .set('x-access-token', shared.tokens.jwt)
        .send({
          filename: "toto.jpg",
          target_type: "user",
          target_id: shared.tokens.group_id2
        })
        .timeout(20000)
        .end(function(err, res) {

            res.body.file_id.should.be.a('string');
            res.body.url.should.be.a('string');

            res.should.have.status(200); // 'success' status
            done();
        });
});

    it('upload a csv file @files', function(done) {
            chai.request(server)
                .post('/api/upload/csv/')
                .set('x-access-token', shared.tokens.jwt)
                .field('type', 'batch_invite')
                .field('group',shared.tokens.group_id1)
                .attach('file', './test/invites.csv')
                .timeout(20000)
                .end(function(err, res) {
                    res.should.have.status(200); // 'success' status
                    res.body.should.be.like({
                        task: 'CSV_JOB',
                        payload:
                        {
                            type: 'batch_invite',
                            group: shared.tokens.group_id1
                        },
                        progress: 0,
                        state: 'new'
                    });
                    done();
                });
        });


        it('upload a csv file directly @files', function(done) {
            chai.request(server)
                .post(`/api/upload/csv/batch_invite/${shared.tokens.group_id1}`)
                .set('x-access-token', shared.tokens.jwt)
                .attach('file', './test/invites.csv')
                .timeout(20000)
                .end(function(err, res) {
                    res.should.have.status(200); // 'success' status
                    res.body.should.be.like({
                        task: 'CSV_JOB',
                        payload:
                        {
                            type: 'batch_invite',
                            group: shared.tokens.group_id1
                        },
                        progress: 0,
                        state: 'new'
                    });
                    done();
                });
        });

});