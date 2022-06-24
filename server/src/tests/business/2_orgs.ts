//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../../server').app;
let should = chai.should();
//let expect = chai.expect();

import * as mocha from 'mocha';
import * as shared from './shared';
import { expect } from 'chai';


//import Mission = require('../../app/dataAccess/schemas/MissionSchema');
//import MissionModel = require('../../app/model/MissionModel');

import Organization = require('../../app/dataAccess/schemas/OrganizationSchema');
import OrganizationModel = require('../../app/model/OrganizationModel');

import Group = require('../../app/dataAccess/schemas/GroupSchema');
import Job = require('../../app/dataAccess/schemas/JobSchema');

import GroupModel = require('../../app/model/GroupModel');



chai.use(chaiHttp);
//Our parent block
describe('BackOffice : Main', () => {

    let org_id:string;
    let mission:any;
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
    describe('ORG Backoffice', () => {

        // todo

        it('FAIL on GET all the Orgs without Auth', (done) => {
            chai.request(server)
                .get('/api/orgs')
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.be.a('object');
                    res.body.should.be.eql({'error':'error.access_forbidden'});
                done();
            });
        });


        it('create an org with Auth', (done) => {
            shared.testOrg['entity'] = shared.tokens.entity_id
            chai.request(server)
                .post('/api/orgs')
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .send(shared.testOrg)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('name');
                    res.body.name.should.be.eq(shared.testOrg.name);
                    res.body.should.have.property('id');
                    res.body.id.should.be.eq(shared.testOrg.id);
                    res.body.should.have.property('created');
                    res.body.should.have.property('updated');
                    res.body.should.have.property('admins');
                    res.body.admins.should.be.a('array');
                    res.body.admins.length.should.be.eql(2);
                    res.body.should.have.property('_id');
                    res.body.should.have.property('entity');
                    res.body.entity.should.be.eq(shared.tokens.entity_id);
                    res.body.should.have.property('_id');
                    shared.tokens.new_org_id = res.body._id;
                    done();
                });
        });

        it('should fail to create an org with same name ', (done) => {
            let org = {
                name: shared.testOrg.name.toLowerCase(),
                id: shared.testOrg.id.toUpperCase(),
            }

            chai.request(server)
                .post('/api/orgs')
                .set('x-access-token', shared.tokens.jwt)
                .send(org)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('error');
                    res.body.error.should.be.eq('An organisation already exists with this name/id');
                    done();
                });
        });


        it('create a different org', (done) => {
            let org = {
                name: "another org",
                id: "another desc",
            }
            chai.request(server)
                .post('/api/orgs')
                .set('x-access-token', shared.tokens.jwt)
                .send(org)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('name');
                    res.body.name.should.be.eq(org.name);
                    res.body.should.have.property('admins');
                    res.body.admins.should.be.a('array');
                    res.body.admins.length.should.be.eql(0);
                    res.body.should.have.property('_id');
                    done();
                });
        });


        it('GET all the Orgs with Auth', (done) => {
            chai.request(server)
                .get('/api/orgs')
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(3);
                    let itm = res.body[1];
                    itm.should.be.a('object');
                    itm.should.have.property('id');
                    //itm.should.be.like(shared.testOrg);
                    itm.should.have.property('name');
                    itm.name.should.be.eq(shared.testOrg.name);
                    itm.should.have.property('admins');
                    itm.admins.should.be.a('array');
                    itm.admins.length.should.be.eq(2);
                    itm.should.have.property('members');
                    itm.members.should.be.a('array');
                    itm.members.length.should.be.eq(2);
                    done();
            });
        });

        it('GET Orgs user count', (done) => {
            chai.request(server)
                .get(`/api/orgs/${shared.tokens.new_org_id}/usercount`)
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.be.eql({'count':2});
                    done();
            });
        });



        // test user should now be in oradmin list in org
        it('INVITE a email to an Orgs as Orgadmin', (done) => {
            chai.request(server)
                .put(`/api/orgs/${shared.tokens.new_org_id}/promote/test@test.org`)
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {

                    res.should.have.status(200);
                    res.body.should.be.a('object');

                    let itm = res.body;
                    // itm.should.be.eql({});
                    itm.should.have.property('admins');
                    itm.should.have.property('admins');
                    itm.admins.should.be.a('array');
                    itm.admins.length.should.be.eq(3);
                    itm.admins[2].should.be.a('string');
                    shared.tokens.new_orguser_id = itm.admins[2];
                    itm.should.have.property('id');
                    itm.id.should.be.eq(shared.testOrg.id);
                    itm.should.have.property('name');
                    itm.name.should.be.eq(shared.testOrg.name);
                    done();
            });
        });


        it('invited users should be warned', (done) => {
            chai.request(server)
                .get(`/api/jobs`)
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    let founditem = false;
                    let emails = [];
                    let count = 0;
                    let admins = ["entadmin@test.org", "badentadmin@test.org","goodentadmin@test.org"];

                    for(let itm of res.body) {
                        // itm.should.be.eql({});
                        itm.should.have.property('state');
                        itm.state.should.be.eql('new');
                        itm.should.have.property('task');

                        itm.should.have.property('payload');
                        itm.payload.should.be.a('object');
                        itm.payload.should.have.property('email');

                        console.log(itm.payload.email);
                        if (admins.indexOf(itm.payload.email) == -1) {

                            emails.push(itm.payload.email);

                            if ((itm.payload.email == 'test1@test.org') || (itm.payload.email  =='test2@test.org')) {
                                itm.task.should.be.eql('warn.user_invited_to_ent_orgadmin');
                                continue;
                            }


                            if (itm.payload.email == 'orgadmin@test.org') {
                                count = count + 1;
                                if (count == 2) {
                                    itm.task.should.be.eql('warn.user_promoted_to_orgadmin');
                                } else {
                                    itm.task.should.be.eql('warn.user_invited_to_ent_orgadmin');
                                }
                                continue;
                            }

                            itm.task.should.be.eql('warn.user_invited_to_orgadmin')
                        } else {

                            itm.task.should.be.eql('warn.user_promoted_to_entadmin')
                        }
                    }

                    expect(emails).to.have.members(['orgadmin@test.org',
                            'test1@test.org', 'test2@test.org', 'bob@test.org','test@test.org']);

                    done();
            });
        });

        //  test user should now exist and be pending
        //this.new_user_id
        it('invited user should be pending', (done) => {
            chai.request(server)
                .get(`/api/users/${shared.tokens.new_orguser_id}`)
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    let itm = res.body;
                    itm.should.have.property('status');
                    itm.status.should.be.eql('pending');
                    itm.should.have.property('email');
                    itm.email.should.be.eql('test@test.org');
                    done();
            });
        });

        // test todo : test user should be allowed to register
        it('invited user should be allowed to register', (done) => {
            chai.request(server)
                .post(`/api/register`)
                .send({
                    username: 'test_org_admin',
                    password: 'this_is_password',
                    email:  'test@test.org'
                }).end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('data');
                    res.body.data.should.be.a('object');
                    let itm = res.body.data;
                    itm.should.have.property('jwt');
                    shared.tokens.orgadmin_jwt = itm.jwt;
                    itm.should.have.property('orgs');
                    itm.orgs.should.be.a('array');
                    itm.orgs.length.should.be.eq(1);
                    itm.orgs[0].should.be.eq(shared.tokens.new_org_id);

                    done();
            });
        });

        it('invited user now be created', (done) => {
            chai.request(server)
                .get(`/api/users/${shared.tokens.new_orguser_id}`)
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    let itm = res.body;
                    // itm.should.be.eql({});
                    itm.should.have.property('status');
                    itm.status.should.be.eql('created');
                    itm.should.have.property('email');
                    itm.should.have.property('_id');
                    itm._id.should.be.eql(shared.tokens.new_orguser_id);
                    itm.email.should.be.eql('test@test.org');
                    done();
            });
        });

        // test user should now be in oradmin list in org
        it('INVITE several emails to an Orgs as Orgadmin', (done) => {
            chai.request(server)
                .put(`/api/orgs/${shared.tokens.new_org_id}/promote/`)
                .send({
                    emails:['toto@test.org','tata@test.org']
                })
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {

                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.be.like({
                        id:shared.testOrg.id,
                        name:shared.testOrg.name
                    });

                    let itm = res.body;
                    // itm.should.be.eql({});
                    itm.should.have.property('admins');
                    itm.should.have.property('admins');
                    itm.admins.should.be.a('array');
                    itm.admins.length.should.be.eq(5);
                    done();
            });
        });

        it('BAN several emails to an Orgs as Orgadmin', (done) => {
            chai.request(server)
                .put(`/api/orgs/${shared.tokens.new_org_id}/demote/`)
                .send({
                    emails:['toto@test.org']
                })
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {

                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.be.like({
                        id:shared.testOrg.id,
                        name:shared.testOrg.name
                    });

                    let itm = res.body;
                    // itm.should.be.eql({});
                    itm.should.have.property('admins');
                    itm.admins.should.be.a('array');
                    itm.admins.length.should.be.eq(4);
                    itm.admins[2].should.be.a('string');
                    done();
            });
        });




        // get user org
        // test todo : test user should be allowed to register
        it('orgadmin user should be allowed to get his orgs', (done) => {
            chai.request(server)
                .get(`/api/me/adminorgs`)
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eq(1);
                    let itm = res.body[0];
                    itm.should.be.like({
                        id:'testorg',
                        name:'test Org',
                    });

                    itm.should.have.property('groups');
                    itm.groups.should.be.a('array');

                    itm.should.have.property('admins');
                    itm.admins.should.be.a('array');
                    itm.admins.length.should.be.eq(4);
                    let _id = itm.admins[2];
                    _id.should.be.eq(shared.tokens.new_orguser_id);
                    done();
            });
        });

        it('orgadmin user should be allowed to get his orgs via /api/orgs', (done) => {
            chai.request(server)
                .get(`/api/orgs`)
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eq(1);
                    let itm = res.body[0];
                    itm.should.be.like({
                        id:'testorg',
                        name:'test Org',
                    });

                    /*
                    itm.should.have.property('missions');
                    itm.missions.should.be.a('array');
                    */

                    itm.should.have.property('groups');
                    itm.groups.should.be.a('array');

                    itm.should.have.property('admins');
                    itm.admins.should.be.a('array');
                    itm.admins.length.should.be.eq(4);
                    let user = itm.admins[2];
                    user._id.should.be.eq(shared.tokens.new_orguser_id);
                    done();
            });
        });


        it('orgadmin user should NOT be allowed to change his orgs', (done) => {
            chai.request(server)
                .put(`/api/orgs/${shared.tokens.new_orguser_id}`)
                .set('x-access-token', shared.tokens.orgadmin_jwt)
                .send({'max_mission_nb':50})
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.be.a('object');
                    res.body.should.have.property('error');
                    res.body.error.should.be.eq('error.access_forbidden');

                    done();
            });
        });

    });


});