var chai = require("chai"),
    assert = chai.assert,
    expect = chai.expect,
    should = chai.should(),
    request = require('supertest');

  describe("OAuth Routes", function() {

      it ("should be able to authenticate using a user/password", function(done) {
        request(global.test.url)
          .post("/oauth/token")
          .type("form")
          .send({
            grant_type: "password",
            username: global.test.user.email,
            password: global.test.user.password,
            client_id: global.test.client.name,
            client_secret: global.test.client.secret,
          })
          .expect(200)
          .end(function(err, res) {
            if (err) {
              done(err);
            }
            else {
              res.body.should.not.empty;
              res.body.access_token.should.not.be.empty;
              res.body.expires_in.should.be.greaterThan(0);
              res.body.refresh_token.should.not.be.empty;

              global.test.user.access_token = res.body.access_token;
              global.test.user.refresh_token = res.body.refresh_token;

              done();
            }
          });
      });

      it ("should be able to authenticate using a refresh token", function(done) {
        request(global.test.url)
          .post("/oauth/token")
          .type("form")
          .send({
            grant_type: "refresh_token",
            refresh_token: global.test.user.refresh_token,
            client_id: global.test.client.name,
            client_secret: global.test.client.secret,
          })
          .expect(200)
          .end(function(err, res) {
            if (err) {
              done(err);
            }
            else {
              res.body.should.not.empty;
              res.body.access_token.should.not.be.empty;
              res.body.expires_in.should.be.greaterThan(0);
              res.body.refresh_token.should.not.be.empty;

              global.test.user.access_token = res.body.access_token;
              global.test.user.refresh_token = res.body.refresh_token;

              done();
            }
          });
      });

  });
