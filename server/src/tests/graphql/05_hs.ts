let chai = require('chai');
let chaiHttp = require('chai-http');
let like = require('chai-like');
const graphql = require('graphql');

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
describe('QL-test', function() {

    /*
    * Test the /GET route
    */

    describe('/api/graphql hs stuff', () => {

        it("get series", (done) => {

            const body = {
                //"query": "{ me { username } }"
                query: 'query { series { title }}'
            };

            chai.request(server)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(body)
            .end(function(err, res) {
                res.body.should.be.like({ data: { series: [] }});
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
        });
    
        it("it creates series", (done) => {

            const body = {
                //"query": "{ me { username } }"
                query: `
                    mutation createSeries($series: SeriesInput) {
                        createSeries(input: $series) { _id title id }
                    }`,
                variables: {
                    series: { title: 'test title', id:'test'}
                }
            };

            chai.request(server)
                .post('/graphql')
                .set('content-type', 'application/json')
                .set('x-access-token', shared.tokens.test_user_jwt)
                .send(body)
                .end(function(err, res) {
                    res.body.should.be.like({ data: {
                            createSeries: {
                                title: "test title",
                            }
                        }});
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
            });
        });

        it("get series again", (done) => {

            const body = {
                //"query": "{ me { username } }"
                query: 'query { series { title }}'
            };

            chai.request(server)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(body)
            .end(function(err, res) {
                res.body.should.be.like({ data: { series: [
                    { title: "test title" }
                ] }});
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
        });

    });

});