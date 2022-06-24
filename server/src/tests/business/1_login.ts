//Require the dev-dependencies
let chai = require('chai');
let like = require('chai-like');

let chaiHttp = require('chai-http');
let server = require('../../server').app;
let should = chai.should();

import jobtypes = require('../../config/constants/jobtypes');

import * as mocha from 'mocha';
import * as shared from './shared';

import randomstring = require('randomstring');
import bcrypt = require('bcrypt');
import User   = require('../../app/dataAccess/schemas/UserSchema');
import UserModel = require('../../app/model/UserModel');

chai.use(like);
chai.use(chaiHttp);

//Our parent block
describe('Login', function() {

    let jwt:string = shared.tokens.jwt;
    let jwt2:string;

    /*
    * Test the /GET route
    */
    describe('/LOGIN', () => {

        it("can't log in with wrong login", (done) => {
            let uD = {
                pass: shared._pass,
                email: "noway@hosay.com"
            };

            chai.request(server)
            .post('/api/password')
            .send(uD)
            .end(function(err, res) {
                res.body.error.should.eql('error.no_such_user');
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.error.should.be.like('error.no_such_user');
                done();
            });
        });

        it("should NOT be allowed to register with existing email", (done) => {

            chai.request(server)
            .post('/api/register')
            .send(shared.userData)
            .end(function(err, res) {
                res.should.have.status(400);
                res.body.should.have.property('error');
                res.body.should.be.eql({'error':"error.email_already_exists"});
                done();
            });
        });

        it('should NOT be allowed to register with missing name', (done) => {
            chai.request(server)
            .post('/api/register')
            .send({
                pass: shared._pass2,
                email: shared._email2
            })
            .end(function(err, res) {
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('error');
                res.body.should.be.eql({'error':'error.missing_parameter_username'});
                done();
            });
        });

        it('registers', (done) => {
            chai.request(server)
            .post('/api/register')
            .send({
                password: shared._pass2,
                email: shared._email2,
                username: 'name2'
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.not.have.property('error');
                res.body.should.have.property('data');
                res.body.data.should.have.property('jwt');
                shared.users.register_user = res.body.data;

                res.body.data.should.be.like({
                    username:'name2',
                    points: [ 
                    {'amount': 5, 'cat':'ap'}, 
                    {'amount': 1, 'cat':'kp'}],
                    roles:['guest'],
                    settings:{}
                });
                done();
            });
        });

        it('registering users should have email validated', (done) => {
            chai.request(server)
                .get(`/api/jobs`)
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    
                    let founditem = false;
                    let emails = [];

                    res.body.should.be.like([
                        {
                            'state':'new',
                            'task':jobtypes.USER_CREATED,
                            'payload': {
                                'email':shared._email2
                            }
                        }
                    ])

                    let admins = ["entadmin@test.org", "badentadmin@test.org","goodentadmin@test.org"];
                    for(let itm of res.body) {
                        // itm.should.be.eql({});
                        itm.should.be.like({
                            'state':'new',
                            'task':jobtypes.USER_CREATED,
                            'payload': {
                                'email':shared._email2
                            }
                        })
                    }
                    res.should.have.status(200);
                    res.body.should.be.a('array');

                    done();
            });
        });


        it('logs in with correct password', (done) => {

            chai.request(server)
            .post('/api/password')
            .send(shared.login_user)
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.not.have.property('error');
                res.body.should.have.property('data');
                res.body.data.should.be.a('object');
                res.body.data.should.have.property('_id');

                shared.users.login_user = res.body.data;


                res.body.data.should.be.like({
                    username:'testman',
                    roles:['admin'],
                    points: [{'amount': 0, 'cat':'kp'}],
                    settings:{}
                });
                done();
            });
        });

        it('logs in with upper case email', (done) => {

            chai.request(server)
            .post('/api/password')
            .send({
                email: shared.login_user.email.toUpperCase(),
                pass: shared.login_user.pass
            })
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.not.have.property('error');
                res.body.should.have.property('data');
                res.body.data.should.be.a('object');
                res.body.data.should.have.property('_id');
                res.body.data.should.be.like({
                    username:'testman',
                    points: [{'amount': 0, 'cat':'kp'}],
                    roles:['admin'],
                    settings:{}
                });
                done();
            });
        });


    });

    describe('Auth', () => {
        it('GETs all the Users without Auth', (done) => {
            chai.request(server)
            .get('/api/users')
            .end((err, res) => {
                res.should.have.status(403);
                res.body.should.be.a('object');
                res.body.should.be.eql({'error':'error.access_forbidden'});
                done();
            });
        });

        it('GETs all the Users with admin auth ', (done) => {

            chai.request(server)
                .get('/api/users')
                .set('x-access-token', shared.tokens.jwt)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(3);
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
        

        it('GETs Users by username', (done) => {

            chai.request(server)
                .get(`/api/users/username/${shared._name}`)
                .set('x-access-token', shared.tokens.jwt)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    let itm = res.body[0];
                    itm.should.have.property('email');
                    itm.email.should.be.eql(shared._email);
                    itm.should.have.property('_id');
                    itm.should.have.property('created');
                    itm.should.have.property('roles');
                    itm.roles.should.be.a('array');
                    itm.roles.should.be.eql(['admin']);
                    done();
                });
        });

        it('GETs Users by id', (done) => {

            chai.request(server)
                .get(`/api/users/id/${shared._id}`)
                .set('x-access-token', shared.tokens.jwt)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    let itm = res.body[0];
                    itm.should.have.property('email');
                    itm.email.should.be.eql(shared._email);
                    itm.should.have.property('_id');
                    itm.should.have.property('created');
                    itm.should.have.property('roles');
                    itm.roles.should.be.a('array');
                    itm.roles.should.be.eql(['admin']);
                    done();
                });
        });

        it('gets my settings', (done) => {
            chai.request(server)
                .get(`/api/me/settings`)
                .set('x-access-token', shared.tokens.jwt)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.have.property('body');
                    res.body.should.be.a('object');
                    res.body.should.be.like({
                    });
                    done();
                });
        });

        it('gets redacted users', (done) => {
            chai.request(server)
                .get(`/api/me/users/${shared.users.admin._id}`)
                .set('x-access-token', shared.tokens.jwt)
                .end(function (err, res) {
                    res.should.have.property('body');
                    res.body.should.be.a('object');
                    res.body.should.be.like({
                        'username':'testman',
                    });
                    res.should.have.status(200);

                    done();
                });
        });



        it('updates my settings', (done) => {
            chai.request(server)
                .put(`/api/me/settings`)
                .send({
                    test:'result'
                })
                .set('x-access-token', shared.tokens.jwt)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.have.property('body');
                    res.body.should.be.a('object');
                    res.body.should.be.like({
                        test:'result'
                    });
                    done();
                });
        });

        

        it('gets my updated settings', (done) => {
            chai.request(server)
                .get(`/api/me/settings`)
                .set('x-access-token', shared.tokens.jwt)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.have.property('body');
                    res.body.should.be.a('object');
                    res.body.should.be.like({
                        test:'result'
                    });
                    done();
                });
        });

            
        it('should be allowed to update my settings again', (done) => {
            chai.request(server)
                .put(`/api/me/settings`)
                .send({
                    test2:'result2'
                })
                .set('x-access-token', shared.tokens.jwt)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.be.like({
                        test:'result'
                    });
                    done();
                });
        });

        it('should be allowed to get my combined settings', (done) => {
            chai.request(server)
                .get(`/api/me/settings`)
                .set('x-access-token', shared.tokens.jwt)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.have.property('body');
                    res.body.should.be.a('object');
                    res.body.should.be.like({
                        test:'result',
                        test2:'result2'
                    });
                    done();
                });
        });


        it('should be allowed to get all notifs', (done) => {
            chai.request(server)
                .get(`/api/notifs`)
                .set('x-access-token', shared.tokens.jwt)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.have.property('body');
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(0);
                    done();
                });
        });

        it('should be allowed to get all notifs', (done) => {
            chai.request(server)
                .get(`/api/me/notifs`)
                .set('x-access-token', shared.tokens.jwt)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.have.property('body');
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(0);
                    done();
                });
        });


        it('should be allowed to update my name & first name', (done) => {
            chai.request(server)
                .put(`/api/me/`)
                .send({
                    first_name:'Bob',
                    name:'The Builder'
                })
                .set('x-access-token', shared.tokens.jwt)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.have.property('body');
                    res.body.should.be.a('object');
                    res.body.should.be.like({
                        first_name:'Bob',
                        name:'The Builder'
                    });
                    done();
                });
        });

        it('checks email availability', (done) => {
            chai.request(server)
            .get(`/api/check/email/${shared.userData.email}`)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.have.property('body');
                res.body.should.be.a('object');
                res.body.should.be.like({
                    available:false,
                    param:'email',
                    value:shared.userData.email
                });
                done();
            });
        });


        it('checks email availability', (done) => {
            chai.request(server)
            .get(`/api/check/email/me@you.com`)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.have.property('body');
                res.body.should.be.a('object');
                res.body.should.be.like({
                    available:true,
                    param:'email',
                    value:'me@you.com'
                });
                done();
            });
        });

        it('checks email availability', (done) => {
            chai.request(server)
            .get(`/api/check/username/mike`)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.have.property('body');
                res.body.should.be.a('object');
                res.body.should.be.like({
                    available:true,
                    param:'username',
                    value:'mike'
                });
                done();
            });
        });


        /*
        it('[TODO] it should not be allowed to GET all the Users with auth but missing admin role', (done) => {
            console.log('jwt2 : [', jwt2,"].");
            console.log('jwt2 : [', this.jwt2,"].");
            chai.request(server)
            .get('/api/users')
            .set('x-access-token', this.jwt2)
            .end(function (err, res) {
                res.should.have.status(403);
                res.body.should.be.a('object');
                res.body.should.be.eql({'message':'Forbidden'});
                done();
            });
        });*/
    });


});
