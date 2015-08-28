var chai = require("chai"),
    assert = chai.assert,
    expect = chai.expect,
    should = chai.should()
    q = require("q");

  describe("Testing API Services", function() {
    var req, res = null;

    // Setup the initial user
    before(function(done) {
      var manager = require("./../lib/encryption-manager");

      q.when(manager.hash("password"))
        .then(function(hash) {

          var User = require("./../lib/models/auth/user");

          var admin = new User();

          admin.name = "Admin";
          admin.email = "admin@testing.com";
          admin.sms = "1234567890";
          admin.password = hash;
          admin.isadmin = true;

          admin.save(done);
        })
        .catch(function(err) {
          done(err);
        })
    });

    beforeEach(function() {
      req = {};
      res = {
        locals: {}
      }
    });

    describe("Auth Services", function() {
      describe("Session Service", function() {

        var SessionService = require("./../lib/services/auth/session-svc");
        var service = new SessionService(req, res);

        it("should try", function() {
          return expect(1).to.equal(2);
        })
      })
    });
  });
