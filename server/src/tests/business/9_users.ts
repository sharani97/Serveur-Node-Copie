//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../../server').app;
let should = chai.should();

import User = require('../../app/dataAccess/schemas/UserSchema');
import UserModel = require('../../app/model/UserModel');
import * as shared from './shared';
import { ITEM_NOT_FOUND } from '../../config/messages/errors';


chai.use(chaiHttp);
//Our parent block
describe('User REST methods', () => {
    /*beforeEach((done) => { //Before each test we empty the database
        User.remove ({}, (err) => {
           done();
        });
    });*/
/*
  * Test the /GET route
  */


  
    describe('/GET Users', () => {
        it('FAIL on GET all the Users without Auth', (done) => {
        chai.request(server)
            .get('/api/users')
            .end((err, res) => {
                res.should.have.status(403);
                res.body.should.be.a('object');
                res.body.should.be.eql({'error':'error.access_forbidden'});
                done();
            });
        });
    });

    describe('/GET Users', () => {
        it( 'work to GET all the Users with Auth', (done) => {
        chai.request(server)
            .get('/api/users')
            .set('x-access-token', shared.tokens.jwt)
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(19);
                for (let itm of res.body) {
                    itm.should.have.property('email');
                    itm.should.have.property('_id');
                    itm.should.have.property('created');
                    itm.should.have.property('roles');
                    itm.roles.should.be.a('array');
                }
                done();
            });
        });
    });

    describe('/GET 1 User ', () => {
        it('user who registered should have a last cnx time', (done) => {
        chai.request(server)
            .get(`/api/users/${shared.users.register_user._id}`)
            .set('x-access-token', shared.tokens.jwt)
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                let itm = res.body;
                itm.should.have.property('_id');
                itm.should.have.property('created');
                itm.should.have.property('activated');
                // itm.should.have.property('last_connexion');
                // user never logged in only registered
                itm.should.be.like({
                    'email': 'test2@test.com',
                    'roles': ['guest']
                })
                done();
            });
        });
    });

    describe('/GET Users by email', () => {
        it( 'work to GET a Users by email', (done) => {
        chai.request(server)
            .get(`/api/users/email/${shared.login_user.email}`)
            .set('x-access-token', shared.tokens.jwt)
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(1);
                let itm = res.body[0];

                itm.should.be.like({
                    'email':shared.login_user.email,
                    'roles':['admin']
                })
                itm.should.have.property('last_connexion');

                itm.should.have.property('_id');
                itm.should.have.property('created');
                //itm.should.have.property('activated');
                // user was pre created so never registered
                done();
            });
        });
    });


});