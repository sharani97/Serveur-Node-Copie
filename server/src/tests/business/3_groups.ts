//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../../server').app;
let should = chai.should();

import * as mocha from 'mocha';
import * as shared from './shared';


//import Mission = require('../../app/dataAccess/schemas/MissionSchema');
//import MissionModel = require('../../app/model/MissionModel');

import Organization = require('../../app/dataAccess/schemas/OrganizationSchema');
import OrganizationModel = require('../../app/model/OrganizationModel');

import Group = require('../../app/dataAccess/schemas/GroupSchema');
import Job = require('../../app/dataAccess/schemas/JobSchema');

import GroupModel = require('../../app/model/GroupModel');



chai.use(chaiHttp);
//Our parent block
describe('BackOffice : Groups', () => {

    let org_id:string;
    let idea_id:string;
    let mission:any;
    let idea:any
    let new_user_id:string;
    let new_user_jwt:string;
    
    // todo check if you can use async here ...
    mocha.before((done) => {
        //Organization.remove ({}, (err) => {
        //    Group.remove ({}, (err) => {
                // Mission.remove ({}, (err) => {
                    //let newUser = new Organization(shared.testOrg);
                    //newUser.save().then(() => done());
                    done();
                //});
          //  });
        //});
    });

    /*
    * Test the /GET route
    */
    describe('Org Group BO', () => {

        it('should fail to create a Group where org does not belong to orgadmin', (done) => {
            chai.request(server)
                .post('/api/groups')
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .send({
                    name:"this is a test group",
                    description:"this is a test group description",
                    org : shared.tokens.general_org_id
                })
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.be.a('object');
                    res.body.should.be.eql({'error':'error.access_forbidden'});
                    done();
                });
        });

        it('should fail to create a Group without a name', (done) => {
            chai.request(server)
                .post('/api/groups')
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .send({
                    //title:"this is a test mission",
                    //description:"this is a test mission description",
                    org : shared.tokens.new_org_id
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.be.eql({'error':'error.missing_parameter_name'});
                    done();
                });
        });

        it('create a Group with Auth where user is orgadmin ', (done) => {
            chai.request(server)
                .post('/api/groups')
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .send({
                    name: "this is a test group",
                    description:"this is a test group description",
                    org:shared.tokens.new_org_id,
                    invitees:[shared.test_user.email, 'bo@test.org']
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('name');
                    res.body.should.have.property('description');
                    res.body.should.have.property('org');
                    res.body.should.have.property('members');
                    res.body.members.should.be.a('array');
                    res.body.members.length.should.be.eq(2);
                    res.body.should.have.property('_id');
                    shared.tokens.group_id1 = res.body._id;

                    done();
                });
        });

        it('create a second Group with Auth', (done) => {
            chai.request(server)
                .post('/api/groups')
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .send({
                    name: "this is a second test group",
                    description:"this is a second test group description",
                    org:shared.tokens.new_org_id,
                    invitees:[]
                })
                .end((err, res) => {

                    res.should.have.status(200);
                    res.body.should.have.property('name');
                    res.body.should.have.property('description');
                    res.body.should.have.property('org');
                    res.body.should.have.property('members');
                    res.body.members.should.be.a('array');
                    res.body.members.length.should.be.eq(0);
                    res.body.should.have.property('_id');
                    shared.tokens.group_id2 = res.body._id;

                    done();
                });
        });


        it('delete a Group when you are orgadmin', (done) => {
            chai.request(server)
                .delete('/api/groups/'.concat(shared.tokens.group_id2))
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.eql({});
                    done();
                });
        });

        it('(re)reate a second Group with Auth', (done) => {
            chai.request(server)
                .post('/api/groups')
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .send({
                    name: "this is a second test group",
                    description:"this is a second test group description",
                    org:shared.tokens.new_org_id,
                    invitees:[]
                })
                .end((err, res) => {

                    res.should.have.status(200);
                    res.body.should.have.property('name');
                    res.body.should.have.property('description');
                    res.body.should.have.property('org');
                    res.body.should.have.property('members');
                    res.body.members.should.be.a('array');
                    res.body.members.length.should.be.eq(0);
                    res.body.should.have.property('_id');
                    shared.tokens.group_id2 = res.body._id;

                    done();
                });
        });


        it('should fail to create a second Group with same name', (done) => {
            chai.request(server)
                .post('/api/groups')
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .send({
                    name: "this is a second test group",
                    org:shared.tokens.new_org_id
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.like({error:'error.group_exists_in_org'});
                    done();
                });
        });

        it('invite users to the group one by one', (done) => {
            chai.request(server)
                .put(`/api/groups/${shared.tokens.group_id1}/invite/joe@test.org`)
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .send({
                    //invitees:['jim@test.org', 'bo@test.org']
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('name');
                    res.body.should.have.property('description');
                    res.body.should.have.property('org');
                    res.body.should.have.property('members');
                    res.body.members.should.be.a('array');
                    res.body.members.length.should.be.eq(3);
                    res.body.should.have.property('_id');
                    done();
                });
        });

        it('batch invite should work', (done) => {
            chai.request(server)
                .put(`/api/groups/${shared.tokens.group_id1}/invite/joe@test.org`)
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .send({
                    invitees:[shared.test_user.email, 'bill@test.org', 'bob@test.org']
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('name');
                    res.body.should.have.property('description');
                    res.body.should.have.property('org');
                    res.body.should.have.property('members');
                    res.body.members.should.be.a('array');
                    res.body.members.length.should.be.eq(5);
                    res.body.should.have.property('_id');


                    done();
                });
        });

        it('invite is limited', (done) => {
            chai.request(server)
                .put(`/api/groups/${shared.tokens.group_id1}/invite/joe@test.org`)
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .send({
                    invitees:[shared.test_user.email, 'bill@atata.org', 'bob@popopo.org']
                })
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.be.like({
                        'error': 'error.too_many_users_invited'
                    })

                    done();
                });
        });


        it('batch remove should work', (done) => {
            chai.request(server)
                .put(`/api/groups/${shared.tokens.group_id1}/remove`)
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .send({
                    emails:['bob@test.org']
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('name');
                    res.body.should.have.property('description');
                    res.body.should.have.property('org');
                    res.body.should.have.property('members');
                    res.body.members.should.be.a('array');
                    res.body.members.length.should.be.eq(4);
                    res.body.should.have.property('_id');
                    done();
                });
        });


        it('get users should work', (done) => {
            chai.request(server)
                .get(`/api/groups/${shared.tokens.group_id1}/members/`)
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eq(4);
                    for (let itm of res.body) {
                        itm.should.have.property('_id');
                        itm.should.have.property('email');
                        itm.should.have.property('status');
                        itm.should.have.property('username');
                    }


                    done();
                });
        });

         it('invited user should be allowed to register', (done) => {
            chai.request(server)
            .post(`/api/register`)
            .send({
                username: shared.test_user.username,
                password: shared.test_user.pass,
                email:    shared.test_user.email
            }).end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('data');
                res.body.data.should.be.a('object');
                let itm = res.body.data;
                itm.should.have.property('jwt');
                itm.should.have.property('username');
                itm.username.should.eq(shared.test_user.username);
                shared.tokens.test_user_jwt = itm.jwt;
                shared.tokens.test_user = itm;
                itm.should.have.property('orgs');
                itm.orgs.should.be.a('array');
                itm.orgs.length.should.be.eq(0);

                done();
            });

        });

    });


});