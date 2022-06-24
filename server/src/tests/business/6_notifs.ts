//Require the dev-dependencies
let http = require('http');

let chai = require('chai');
let chaiHttp = require('chai-http');

let server = require('../../server').app;

let should = chai.should();
let expect = chai.expect;

import * as shared from './shared';
// import NotifModel = require('../../app/model/NotifModel');
import * as notiftypes from '../../config/constants/notiftypes';

chai.use(chaiHttp);

describe('Notifs', () => {


    describe('Rest API', () => {
        it( 'GET all my active notifs (i.e. none for now)', (done) => {
        chai.request(server)
            .get('/api/me/notifs')
            .set('x-access-token', shared.tokens.jwt)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(0);
                done();
            });
        });

        it( 'create an active notifs (i.e. fake a worker working)', (done) => {

            let notif = {
                type: notiftypes.TEST_NOTIF,
                target:shared.users.admin._id,
                read: false
            }
            chai.request(server)
                .post('/api/notifs')
                .set('x-access-token', shared.tokens.jwt)
                .send(notif)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.be.like(notif);

                    shared.tokens.notif_id = res.body._id;
                    done();
                });
        });
        it( 'GET all my active notifs (i.e. 1 now)', (done) => {
            chai.request(server)
                .get('/api/me/notifs')
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    res.body[0].should.be.like({
                        type: notiftypes.TEST_NOTIF,
                        target:shared.users.admin._id,
                        _id:shared.tokens.notif_id,
                        read: false
                    });
                    done();
                });
            });
        it('set notifs to read', (done) => {

            chai.request(server)
                .put('/api/me/notifs/read')
                .set('x-access-token', shared.tokens.jwt)
                .send({ids:[shared.tokens.notif_id]})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.be.like({
                        status:'ok'
                    });
                    done();
                });
        });
        it( 'GET all my active notifs (i.e. now 1 even though marked as read)', (done) => {
            chai.request(server)
                .get('/api/me/notifs')
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    res.body[0].should.be.like({
                        type: notiftypes.TEST_NOTIF,
                        target:shared.users.admin._id,
                        _id:shared.tokens.notif_id,
                        read: true
                    });
                    done();
                });
            });
    });
});


