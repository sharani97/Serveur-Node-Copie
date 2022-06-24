//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../../server').app;
let should = chai.should();
//let expect = chai.expect();

import * as mocha from 'mocha';
import * as shared from './shared';
import { expect } from 'chai';


chai.use(chaiHttp);
//Our parent block
describe('BackOffice : Entities', () => {


    /*
    * Test the /GET route
    */
    describe('ORG Entity', () => {

        // todo

        it('FAIL on GET all the Entities without Auth', (done) => {
            chai.request(server)
                .get('/api/entities')
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.be.a('object');
                    res.body.should.be.eql({'error':'error.access_forbidden'});
                done();
            });
        });


        it('create an entity with Auth', (done) => {
            chai.request(server)
                .post('/api/entities')
                .set('x-access-token', shared.tokens.jwt)
                .send(shared.generalEntity)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('name');
                    res.body.name.should.be.eq(shared.generalEntity.name);
                    res.body.should.have.property('id');
                    res.body.id.should.be.eq(shared.generalEntity.id);
                    res.body.should.have.property('created');
                    res.body.should.have.property('updated');
                    res.body.should.have.property('admins');
                    res.body.admins.should.be.a('array');
                    res.body.admins.length.should.be.eql(1);
                    shared.tokens.entity_id = res.body._id;
                    done();
                });
        });
        // test todo : test user should be allowed to register
        it('invited user should be allowed to register', (done) => {
            chai.request(server)
                .post(`/api/register`)
                .send({
                    username: 'ent_admin',
                    password: 'this_is_password',
                    email:  'entadmin@test.org'
                }).end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('data');
                    res.body.data.should.be.a('object');
                    let itm = res.body.data;
                    itm.should.have.property('jwt');
                    shared.users.ent_admin = itm;
                    shared.tokens.ent_admin_jwt = itm.jwt;
                    itm.should.have.property('ents');
                    itm.ents.should.be.a('array');
                    itm.ents.length.should.be.eq(1);
                    itm.ents[0].should.be.eq(shared.tokens.entity_id);
                    itm.should.have.property('orgs');
                    itm.orgs.should.be.a('array');
                    itm.orgs.length.should.be.eq(0);

                    done();
            });
        });

        // test user should now be in oradmin list in org
        it('INVITE a email to an Entity as Orgadmin', (done) => {
            chai.request(server)
                .put(`/api/entities/${shared.tokens.entity_id}/orgpromote/orgadmin@test.org`)
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {

                    res.should.have.status(200);
                    res.body.should.be.a('object');

                    let itm = res.body;
                    // itm.should.be.eql({});
                    itm.should.have.property('admins');
                    itm.admins.should.be.a('array');
                    itm.admins.length.should.be.eq(1);
                    itm.should.have.property('orgadmins');
                    itm.orgadmins.length.should.be.eq(1);
                    itm.orgadmins[0].should.be.a('object');
                    itm.orgadmins[0].should.have.property('_id')
                    shared.tokens.new_orguser_id = itm.orgadmins[0]._id;
                    itm.should.have.property('id');
                    itm.id.should.be.eq(shared.generalEntity.id);
                    itm.should.have.property('name');
                    itm.name.should.be.eq(shared.generalEntity.name);
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
                    let admins = ["entadmin@test.org", "badentadmin@test.org","goodentadmin@test.org"];
                    for(let itm of res.body) {
                        // itm.should.be.eql({});
                        itm.should.have.property('state');
                        itm.state.should.be.eql('new');
                        itm.should.have.property('task');

                        itm.should.have.property('payload');
                        itm.payload.should.be.a('object');
                        itm.payload.should.have.property('email');
                        emails.push(itm.payload.email);

                        if (itm.payload.email == 'entadmin@test.org') {
                            itm.task.should.be.eql('warn.user_promoted_to_entadmin')
                        } else {
                            itm.task.should.be.eql('warn.user_invited_to_ent_orgadmin')
                        }
                    }

                    expect(emails).to.have.members(['entadmin@test.org', 'orgadmin@test.org']);
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
                    itm.email.should.be.eql('orgadmin@test.org');
                    done();
            });
        });

        // test todo : test user should be allowed to register
        it('invited user should be allowed to register', (done) => {
            chai.request(server)
                .post(`/api/register`)
                .send({
                    username: 'org_admin',
                    password: 'this_is_password',
                    email:  'orgadmin@test.org'
                }).end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('data');
                    res.body.data.should.be.a('object');
                    let itm = res.body.data;
                    itm.should.have.property('jwt');
                    shared.tokens.orgadmin_jwt = itm.jwt;
                    shared.tokens.new_orguser_id = itm._id;
                    itm.should.have.property('orgs');
                    itm.orgs.should.be.a('array');
                    itm.orgs.length.should.be.eq(0); // duh none created yet
                    //itm.orgs[0].should.be.eq(shared.tokens.new_org_id);

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
                    itm.email.should.be.eql('orgadmin@test.org');
                    done();
            });
        });

        // test user should now be in oradmin list in org
        it('INVITE several emails to an Entity as Orgadmin', (done) => {
            chai.request(server)
                .put(`/api/entities/${shared.tokens.entity_id}/orgpromote/`)
                .send({
                    emails:['test1@test.org','test2@test.org']
                })
                .set('x-access-token', shared.tokens.jwt) 
                .end((err, res) => {

                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.be.like({
                        id:shared.generalEntity.id,
                        name:shared.generalEntity.name
                    });

                    let itm = res.body;
                    // itm.should.be.eql({});
                    itm.should.have.property('admins');
                    itm.should.have.property('orgadmins');
                    itm.orgadmins.should.be.a('array');
                    itm.orgadmins.length.should.be.eq(3);
                    done();
            });
        });


        it('Entamin cannot invite a email to an Entity as Entadmin', (done) => {
            chai.request(server)
                .put(`/api/entities/${shared.tokens.entity_id}/promote/`)
                .send({
                    emails:['badentadmin@test.org','goodentadmin@test.org']
                })
                .set('x-access-token', shared.tokens.ent_admin_jwt) //jwt
                .end((err, res) => {

                    res.should.have.status(403);
                    done();
            });
        });
 

        it('INVITE a email to an Entity as Entadmin', (done) => {
            chai.request(server)
                .put(`/api/entities/${shared.tokens.entity_id}/promote/`)
                .send({
                    emails:['badentadmin@test.org','goodentadmin@test.org']
                })
                .set('x-access-token', shared.tokens.jwt) //jwt
                .end((err, res) => {

                    res.should.have.status(200);
                    res.body.should.be.a('object');

                    let itm = res.body;
                    // itm.should.be.eql({});
                    itm.should.have.property('admins');
                    itm.admins.should.be.a('array');
                    itm.admins.length.should.be.eq(3);
                    itm.orgadmins[1].should.be.a('object');
                    itm.orgadmins[1].should.have.property('_id')
                    itm.orgadmins[2].should.be.a('object');
                    itm.orgadmins[2].should.have.property('_id')
                    done();
            });
        });
        
        
        it('demote an email', (done) => {
            chai.request(server)
                .put(`/api/entities/${shared.tokens.entity_id}/demote/`)
                .send({
                    emails:['badentadmin@test.org']
                })
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {

                    res.body.should.be.a('object');
                    res.body.should.be.like({
                        _id:shared.tokens.entity_id,
                    });
                    res.should.have.status(200);

                    let itm = res.body;
                    // itm.should.be.eql({});
                    itm.should.have.property('admins');
                    itm.admins.should.be.a('array');
                    itm.admins.should.be.like([{
                        email:"entadmin@test.org"
                    }, 
                    {
                        email:"goodentadmin@test.org"
                    }]);
                    
                    itm.admins.length.should.be.eq(2);
                    done();
            });
        });

        


        // get user org
        // test todo : test user should be allowed to register
        /*
        it('orgadmin user should be allowed to create his orgs', (done) => {
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


        it('GET all the Ents with Auth', (done) => {
            chai.request(server)
                .get('/api/entities')
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
                    itm.admins.length.should.be.eq(1);
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



        /*

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

        */
        

    });


});