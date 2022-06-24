let chai = require('chai');
let chaiHttp = require('chai-http');
let like = require('chai-like');


let server = require('../../server').app;
//let should = chai.should();
import { expect } from 'chai';

import * as mocha from 'mocha';

import * as shared from '../business/shared';

//Content-Type: application/json" \

// "query": "{ posts { title } }"


chai.use(like);
chai.use(chaiHttp);

//Our parent block
let mission_id = "";

describe('Hello world GQL tests', function() {

    /*
    * Test the /GET route
    */

    describe('/api/graphql hello', () => {

        it("it says hello", (done) => {

            const body = {
                //"query": "{ me { username } }"
                query: 'query { hello(name:"bob") }'
            };

            chai.request(server)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(body)
            .end(function(err, res) {
                res.body.should.be.like({ data: { hello: "Hello bob!" }});
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
        });
    });

    describe("graphQL availcheck", () => {
        it('checks email', (done)  => {
            const body = {
                //"query": "{ me { username } }"
                query: `
                    query {
                        me  {
                             _id username name email
                            points { _id cat amount }
                        }
                    }`
            };

            chai.request(server)
                .post('/graphql')
                .set('content-type', 'application/json')
                .set('x-access-token', shared.tokens.test_user_jwt)
                .send(body)
                .end(function(err, res) {
                    res.body.should.be.like({ data: {
                            me: {
                                username: "thisisatest",
                                email: "jim@test.org",
                                points: [
                                    { amount: 5, cat: "ap" },
                                    { amount: 1, cat: "kp" }
                                ]
                            }
                        }});
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
            });
        })
    })

    describe('/api/graphql me', () => {

        it("it gets me", (done) => {

            const body = {
                //"query": "{ me { username } }"
                query: `
                    query available($field:UniqueFieldType, $value:String) {
                        available(field:$field, value:$value) 
                    }`,
                    variables:{
                        field:'email',
                        value:'toto@test.org'
                    }
            };

            chai.request(server)
                .post('/graphql')
                .set('content-type', 'application/json')
                .set('x-access-token', shared.tokens.test_user_jwt)
                .send(body)
                .end(function(err, res) {
                    res.body.should.be.like({ data: {
                            available: true
                        }});
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
            });
        });
    });

    describe('/api/graphql scrape', () => {
        it("it scrapes", (done) => {

            const body = {
                //"query": "{ me { username } }"
                query: `query ScrapeUrl($targetUrl:String!) {
                        scrape(targetUrl:$targetUrl) {
                            title
                            desc
                            link
                            image
                            img_type
                            img_width
                            img_height
                        }
                    }`,
                variables: { targetUrl :'http://www.ogp.me'}
            };
            chai.request(server)
                .post('/graphql')
                .set('content-type', 'application/json')
                .set('x-access-token', shared.tokens.test_user_jwt)
                .send(body)
                .end(function(err, res) {
                    res.body.should.be.like({ data: {
                        scrape: {
                            image: 'https://ogp.me/logo.png',
                            img_width: 300,
                            img_height: 300,
                            img_type: 'png',
                            link: 'https://ogp.me',
                            title: 'Open Graph protocol',
                            desc: 'The Open Graph protocol enables any web page to become a rich object in a social graph.'
                        }
                    }});
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
            });
        }).timeout(10000);
    });



});