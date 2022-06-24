//Require the dev-dependencies
let http = require('http');

let chai = require('chai');
let chaiHttp = require('chai-http');
const WebSocket = require('ws');

let server = require('../../server').app;
let server_setup = require('../../server').setup;

let port:number; 
let _srv = require('../../bin/www').server;

let should = chai.should();
let expect = chai.expect;

import * as shared from './shared';

const data = {
  conv_id: undefined,
  message2_id: undefined,
  message1_id: undefined

};

chai.use(chaiHttp);

describe('Messaging', () => {

    before(async function () {
        await server_setup();
        port = server.get('port'); //console.log(server.get('port'));
    });


    describe('Rest API', () => {
        it( 'GET all my active conversations (i.e. none for now)', (done) => {
        chai.request(server)
            .get('/api/me/messages')
            .set('x-access-token', shared.tokens.jwt)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(0);
                done();
            });
        });


        it( 'start a new conversation', (done) => {
        chai.request(server)
            .post(`/api/me/messages/`)
            .set('x-access-token', shared.tokens.jwt)
            .send(
                { to: shared.users.ent_admin._id,
                    msg: 'this is message, is it not'
                })
            .end((err, res) => {
                //res.body.should.be.like({'error':'what error ?'});

                res.body.should.be.like({
                    from: shared.users.admin._id,
                    msg: "this is message, is it not"
                });
                res.should.have.status(200);
                shared.tokens.conversation_id = res.body.conv;
                done();
            });
        });

        it( 'reply', (done) => {
            
            chai.request(server)
                .post(`/api/me/messages/`)
                .set('x-access-token', shared.tokens.ent_admin_jwt)
                .send(
                    { to: shared.users.admin._id,
                        msg: 'this is a reply, is it not'
                    })
                .end((err, res) => {
                    //res.body.should.be.like({'error':'what error ?'});
                    res.should.have.status(200);
                    res.body.should.be.like({
                        'conv':shared.tokens.conversation_id,
                        from: shared.users.ent_admin._id,
                        msg: "this is a reply, is it not",
                    });
                    done();
                });
            });

        it( 'GET all my active conversations (i.e. one)', (done) => {
            chai.request(server)
                .get('/api/me/messages')
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    res.body[0].should.be.like({
                        current_page: 0,
                        dm:true
                    });
                    done();
                });
            });
 
        it( 'GET my conversation for one friend', (done) => {
            chai.request(server)
                .get(`/api/me/messages/${shared.users.ent_admin._id}`)
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.body.should.be.like({
                        messages: [
                            { msg: "this is message, is it not"},
                            { msg: "this is a reply, is it not" }
                        ], 
                        unread:1
                    });
                    res.should.have.status(200);

                    data.conv_id     = res.body._id;
                    data.message2_id = res.body.messages[0]._id;
                    data.message1_id = res.body.messages[1]._id;  
                  
                    done();
                });
            });
    
        it( 'set read status on conversation', (done) => {
                chai.request(server)
                    .put(`/api/me/messages/${shared.users.ent_admin._id}/read/${data.message1_id}`)
                    .send({})
                    .set('x-access-token', shared.tokens.jwt)
                    .end((err, res) => {
                        res.body.should.be.like({
                            status: true
                        });
                        res.should.have.status(200);
                        done();
                    });
                });
        it('FAIL on set previous read status on conversation', (done) => {
            chai.request(server)
                .put(`/api/me/messages/${shared.users.ent_admin._id}/read/${data.message2_id}`)
                .send({})
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.body.should.be.like({
                        status: false
                    });
                    res.should.have.status(200);
                    done();
                });
            });

        it( 'GET my conversation with 0 unread', (done) => {
            chai.request(server)
                .get(`/api/me/messages/${shared.users.ent_admin._id}`)
                .set('x-access-token', shared.tokens.jwt)
                .end((err, res) => {
                    res.body.should.be.like({
                        messages: [
                            { msg: "this is message, is it not"},
                            { msg: "this is a reply, is it not" }
                        ], 
                        unread:0
                    });
                    res.should.have.status(200);
                    done();
                });
            });

            it( 'GET my conversations', (done) => {
                chai.request(server)
                    .get(`/api/me/conversations/`)
                    .set('x-access-token', shared.tokens.jwt)
                    .end((err, res) => {
                        res.body.should.be.like([
                            {
                                unread:0
                            }
                        ]);
                        res.should.have.status(200);
                        done();
                    });
                });

        });

 
    describe('Websocket API', () => {

        it("echoes message", (done) => {

            const ws = new WebSocket(`ws://localhost:${port}`, {
                perMessageDeflate: false
            });


            ws.on('open', function open() {
                ws.send('echo|test echo');
            });

            ws.on('message', function incoming(data) {
                ws.close();
            });

            ws.on('close', function msg(data) {
                done();
            });

        });

        it("ws ent admin auth", (done) => {

            shared.ws.ws_ent_admin = new WebSocket(`ws://localhost:${port}`, {
                perMessageDeflate: false
            });


            let next;

            function test1(data) {
                expect(data).to.eql('auth|ok');
                next();
            }

            shared.ws.ws_ent_admin.on('message', test1);

            next = (data) => {
                shared.ws.ws_ent_admin.removeListener('message', test1);
                done();
            };

            shared.ws.ws_ent_admin.on('open', function open() {
                shared.ws.ws_ent_admin.send(`auth|${shared.users.ent_admin.short_jwt}`);
            });


        });

        it("ws admin auth", (done) => {

            shared.ws.ws_admin = new WebSocket(`ws://localhost:${port}`, {
                perMessageDeflate: false
            });

            let next;

            function test1(data) {
                expect(data).to.eql('auth|ok');
                next();
            }

            shared.ws.ws_admin.on('message', test1);

            next = (data) => {
                shared.ws.ws_admin.removeListener('message', test1);
                done();
            };

            shared.ws.ws_admin.on('open', function open() {
                shared.ws.ws_admin.send(`auth|${shared.users.admin.short_jwt}`);
            });

        });


        it("ws cross post", (done) => {

            shared.ws.ws_ent_admin.on('message', function incoming(data) {

                let bits = data.split("|");
                let obj = JSON.parse(bits[1]);
                expect(bits[0]).to.eql("jmsg");
                expect(obj).to.be.like({
                    to:shared.users.ent_admin._id,
                    from:shared.users.admin._id,
                    msg:'hello'
                }); 

                done();
            });

            shared.ws.ws_admin.send(`mesg|${shared.users.ent_admin._id}|hello`);

        });

    });
});


