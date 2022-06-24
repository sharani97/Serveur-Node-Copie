//Require the dev-dependencies
let chai = require('chai');
let mocha = require('mocha');

let chaiHttp = require('chai-http');
let server = require('../../server').app;
let should = chai.should();

import * as shared from './shared';

import Friendship = require('../../app/dataAccess/schemas/FriendshipSchema');


chai.use(chaiHttp);
//Our parent block
describe('Friends', () => {

    mocha.before(async function () { //Before starting we create an admin user
        await Friendship.remove({}).exec();
    });

    beforeEach((done) => { //Before each test we empty the database
        //Job.remove ({}, (err) => {
           done();
        //});
    });
/*
  * Test the /GET route
  */
    describe('Friends', () => {
        it('gets all my friendships', (done) => {
        chai.request(server)
            .get('/api/me/friends')
            .set('x-access-token', shared.tokens.jwt)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(0);
                done();
            });
        });

        it('sends a friend request', (done) => {
        chai.request(server)
            .put(`/api/me/friends/${shared.users.ent_admin._id}`)
            .set('x-access-token', shared.tokens.jwt)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.be.like({
                    from:shared.users.admin._id,
                    to:shared.users.ent_admin._id,
                    state:'req'
                });
                done();
            });
        });

        it('doesnt send a friend request twice', (done) => {
            chai.request(server)
                .put(`/api/me/friends/${shared.users.ent_admin._id}`)
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.be.like({
                        from:shared.users.admin._id,
                        to:shared.users.ent_admin._id,
                        state:'req'
                    });
                    done();
                });
            });

        it('gets 1 friendship', (done) => {
            chai.request(server)
                .get('/api/me/friends')
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    res.body[0].should.be.like({
                        from:shared.users.admin._id,
                        to:shared.users.ent_admin._id,
                        state:'req'
                    });
                    done();
                });
            });
        
    

        it('accepts a friend request', (done) => {
            let url = `/api/me/friends/${shared.users.admin._id}`;
            chai.request(server)
                .put(url)
                .set('x-access-token', shared.tokens.ent_admin_jwt)
                .end((err, res) => {                
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.be.like({
                        from:shared.users.admin._id,
                        to:shared.users.ent_admin._id,
                        state:'ok'
                    });
                    done();
                });
            });

        it('searches for friends', (done) => {
            chai.request(server)
                .get('/api/me/finduser/bob')
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    res.body[0].should.be.like({
                        email: "test@test.com",
                        first_name: "Bob",
                        id: "test.user",
                        name: "The Builder"
                    })

                    done();
                });
            });

        it('shows friends posts (1/3 - getting empty)', (done) => {
                chai.request(server)
                    .get('/api/me/posts')
                    .set('x-access-token', shared.tokens.jwt)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('array');
                        res.body.length.should.be.eql(0);    
                        done();
                    });
                });

        it('shows friends posts (2/3 - posting)', (done) => {
            chai.request(server)
                .post(`/api/posts`)
                .set('x-access-token', shared.tokens.ent_admin_jwt)
                .send({
                    title: 'test post',
                    target_ids:[shared.users.admin._id],
                    target_type:"users"
                }).end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');

                    res.body.should.be.like({
                        title: 'test post',
                        target_ids:[shared.users.admin._id],
                        target_type:"users"
                    });
                    done();
                });
            });

            it('shows friends posts (3/3 - getting posted)', (done) => {
                chai.request(server)
                    .get('/api/me/posts')
                    .set('x-access-token', shared.tokens.jwt)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('array');
                        res.body.length.should.be.eql(1);   
                        done();
                    });
                });

                it('shows my own posts (4/3 - getting posted)', (done) => {
                    chai.request(server)
                        .get('/api/me/posts')
                        .set('x-access-token', shared.tokens.ent_admin_jwt)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.be.a('array');
                            res.body.length.should.be.eql(1);   
                            done();
                        });
                    });
    

    });


});