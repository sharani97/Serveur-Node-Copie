let chai = require("chai");
let chaiHttp = require("chai-http");
let like = require("chai-like");
const graphql = require("graphql");

let server = require("../../server").app;
//let should = chai.should();
import { expect } from "chai";

import * as mocha from "mocha";

import * as shared from "../business/shared";

//Content-Type: application/json" \

// "query": "{ posts { title } }"

chai.use(like);
chai.use(chaiHttp);

//Our parent block
let mission_id = "";

describe("Admin GQL", function() {
  /*
   * Test the /GET route
   */

  describe("/api/graphql admin", () => {
    it("it logs in", done => {
      const body = {
        //"query": "{ me { username } }"
        query: `mutation {login(email:"${shared.test_user.email}", password:"${shared.test_user.pass}")}`
      };

      chai
        .request(server)
        .post("/graphql")
        .set("content-type", "application/json")
        .send(body)
        .end(function(err, res) {
          // res.body.should.be.like({ data: { jwt: "Hello bob!" }});
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.data.should.be.a("object");
          res.body.data.login.should.be.a("string");
          done();
        });
    });

    it("it gets signed url", done => {
      const body = {
        //"query": "{ me { username } }"
        query: `mutation getSignedUrl($input:FileRequestInput) {getSignedUrl(input:$input){ url file_id }}`,
        variables: {
          input: {
            filename: "toto.jpg",
            target_type: "user",
            target_id: shared.tokens.entity_id
          }
        }
      };

      chai
        .request(server)
        .post("/graphql")
        .set("content-type", "application/json")
        .set("x-access-token", shared.tokens.test_user_jwt)
        .send(body)
        .end(function(err, res) {

          res.body.data.getSignedUrl.file_id.should.be.a('string');
          res.body.data.getSignedUrl.url.should.be.a('string');
          

          res.should.have.status(200);
          done();
        });
    });
  });

  /*
      it("it changes password", (done) => {

          const body = {
              //"query": "{ me { username } }"
              query: 'mutate { hello (name:"bob") }'
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
      */
});
