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

let post_id = "";

describe("Social GQL", function() {
  /*
   * Test the /GET route
   */

  describe("/api/graphql chat", () => {
    it("gets user", done => {
      const body = {
        //"query": "{ me { username } }"
        query: `query user($id: String!) {
                  user(id:$id) {
                      name
                      first_name
                      _id
                  }
                }`,
        variables: {
          id: shared.users.admin._id
        }
      };
      chai
        .request(server)
        .post("/graphql")
        .set("content-type", "application/json")
        .set("x-access-token", shared.tokens.test_user_jwt)
        .send(body)
        .end(function(err, res) {
          res.body.should.be.like({
            data: {
              user: {
                _id: shared.users.admin._id,
                first_name: "Bob",
                name: "The Builder"
              }
            }
          });
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });

    it("finds users", done => {
      const body = {
        //"query": "{ me { username } }"
        query: `query findUsers($input:String) {
          findUsers(input:$input) {
            name
            first_name
            email
            username
            _id
          }
        }`,
        variables: {
          input: "Bo"
        }
      };
      chai
        .request(server)
        .post("/graphql")
        .set("content-type", "application/json")
        .set("x-access-token", shared.tokens.test_user_jwt)
        .send(body)
        .end(function(err, res) {
          res.body.should.be.like({
            data: {
              findUsers: [
                {
                email: "bo@test.org",
                first_name: null,
                name: null,
                username: "user_15"
                },
                {
                  email: "bob@popopo.org",
                  first_name: null,
                  name: null,
                  username: "user_19"
                },
                {
                  email: "bob@test.org",
                  first_name: null,
                  name: null,
                  username: "user_10"
                },
                {
                  email: "test@test.com",
                  first_name: "Bob",
                  name: "The Builder",
                  username: "testman"
                }
              ]
            }
          });
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });

    it("gets conversations", done => {
      const body = {
        //"query": "{ me { username } }"
        query: `query conversations {
                            conversations {
                                usr1
                                usr2
                                _id
                            }
                        }`
      };
      chai
        .request(server)
        .post("/graphql")
        .set("content-type", "application/json")
        .set("x-access-token", shared.tokens.test_user_jwt)
        .send(body)
        .end(function(err, res) {
          res.body.should.be.like({
            data: {
              conversations: []
            }
          });
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });

    it("gets 1 or creates conversation", done => {
      const body = {
        //"query": "{ me { username } }"
        query: `query conversation($user: String) {
                            conversation(user: $user) {
                                _id
                                usr1
                                usr2
                                messages {
                                    from
                                    msg
                                }
                            }
                        }`,
        variables: {
          user: shared.users.admin._id
        }
      };
      chai
        .request(server)
        .post("/graphql")
        .set("content-type", "application/json")
        .set("x-access-token", shared.tokens.test_user_jwt)
        .send(body)
        .end(function(err, res) {
          res.body.should.be.like({
            data: {
              conversation: {
                usr1: shared.users.admin._id,
                messages: []
              }
            }
          });
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });

    it("sends a message", done => {
      const body = {
        query: `mutation sendMessage($to: String, $message:String) {
                            sendMessage(user: $to, message:$message) {
                                _id
                                from
                                msg
                            }
                        }`,
        variables: {
          to: shared.users.admin._id,
          message: "gql rox"
        }
      };

      chai
        .request(server)
        .post("/graphql")
        .set("content-type", "application/json")
        .set("x-access-token", shared.tokens.test_user_jwt)
        .send(body)
        .end(function(err, res) {
          res.body.should.be.like({
            data: {
              sendMessage: {
                from: shared.tokens.test_user._id,
                msg: "gql rox"
              }
            }
          });
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });

    it("the conversation is created", done => {
      const body = {
        //"query": "{ me { username } }"
        query: `query conversations {
                            conversations {
                                usr1
                                usr2
                                _id
                                messages {
                                    from
                                    msg
                                }
                                unread
                            }
                        }`
      };
      chai
        .request(server)
        .post("/graphql")
        .set("content-type", "application/json")
        .set("x-access-token", shared.tokens.jwt)
        .send(body)
        .end(function(err, res) {
          res.body.should.be.like({
            data: {
              conversations: [
                {
                  usr1: shared.users.admin._id,
                  usr2: shared.users.ent_admin._id,
                  messages: [
                    {
                      from: shared.users.admin._id,
                      msg: "this is message, is it not"
                    },
                    {
                      from: shared.users.ent_admin._id,
                      msg: "this is a reply, is it not"
                    },
                    {
                      from: shared.users.admin._id,
                      msg: "hello"
                    }
                  ]
                },
                {
                  usr1: shared.users.admin._id,
                  usr2: shared.tokens.test_user._id,
                  messages: [
                    {
                      from: shared.tokens.test_user._id,
                      msg: "gql rox"
                    }
                  ]
                }
              ]
            }
          });
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });
  });

  describe("/api/graphql post", () => {
    it("create post", done => {
      const body = {
        //"query": "{ me { username } }"
        query: `mutation createPost($post: PostInput) {
                            createPost(input: $post) {
                                _id title description
                            }
                        }`,
        variables: {
          post: {
            title: "gqp test post",
            description: "gqp test post description"
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
          res.body.should.be.like({
            data: {
              createPost: {
                description: "gqp test post description",
                title: "gqp test post"
              }
            }
          });

          post_id = res.body.data.createPost._id;
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });

    it("gets posts", done => {
      const body = {
        //"query": "{ me { username } }"
        query: `query {
                            currentPosts {
                                _id title description
                            }
                        }`
      };
      chai
        .request(server)
        .post("/graphql")
        .set("content-type", "application/json")
        .set("x-access-token", shared.tokens.test_user_jwt)
        .send(body)
        .end(function(err, res) {
          res.body.should.be.like({
            data: {
              currentPosts: [
                {
                  description: "gqp test post description",
                  title: "gqp test post"
                },
                {
                  description: null,
                  title: "test post"
                }
              ]
            }
          });

          res.should.have.status(200);
          res.body.data.currentPosts.should.be.a("array");
          res.body.data.currentPosts.length.should.be.eql(2);
          res.body.data.currentPosts[0]._id.should.be.eql(post_id);
          done();
        });
    });

    it("edits posts", done => {
      const body = {
        //"query": "{ me { username } }"
        query: `query {
          currentPosts {
              _id title description
          }
      }`
      };
      chai
        .request(server)
        .post("/graphql")
        .set("content-type", "application/json")
        .set("x-access-token", shared.tokens.test_user_jwt)
        .send(body)
        .end(function(err, res) {
          res.body.should.be.like({
            data: {
              currentPosts: [
                {
                  description: "gqp test post description",
                  title: "gqp test post"
                },
                {
                  description: null,
                  title: "test post"
                }
              ]
            }
          });

          res.should.have.status(200);
          res.body.data.currentPosts.should.be.a("array");
          res.body.data.currentPosts.length.should.be.eql(2);
          res.body.data.currentPosts[0]._id.should.be.eql(post_id);
          done();
        });
    });

    it("it likes post", done => {
      const body = {
        //"query": "{ me { username } }"
        query: `mutation likeItem($like: LikeInput) {
                            likeItem(input: $like) {
                                like { _id target_id target_type }
                                reward { xp kp ap ip }
                            }
                        }`,
        variables: {
          like: {
            target_id: post_id,
            target_type: "post",
            nb: 1
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
          res.body.should.be.like({
            data: {
              likeItem: {
                like: {
                  target_type: "post",
                  target_id: post_id
                },
                reward: {
                  ap: 1,
                  ip: 0,
                  kp: 0.3
                }
              }
            }
          });

          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });
  });
});
