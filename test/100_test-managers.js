var chai = require("chai"),
    assert = chai.assert,
    expect = chai.expect,
    should = chai.should()
    q = require("q");

describe("Testing API Managers", function() {

  describe("Properties", function() {
  	var manager = require("./../lib/properties-manager");
  	var properties = null;

  	it("should be able to load from test.properties", function (done) {

  	  q.when(manager.getProperties())
  	  	.then(function(props) {
  	  		properties = props;
  	  		done();
  	  	})
  	  	.catch(function(err) {
  	  		done(err);
  	  	});
  	});

  	it("should not return null", function() {
  		return properties.should.not.be.null;
  	});

  	it("should not be empty", function() {
  		return properties.should.not.be.empty;
  	})
  });

  describe("Encryption", function() {
  	var manager = require("./../lib/encryption-manager");

  	var password = "aT3stP4assw0rd";
  	var cipher = "";
  	var decyphered = "";

  	var hash = null;

  	it("should have an encrypt function", function() {
  		manager.encrypt.should.be.instanceOf(Function);
  	});

  	it("should be able to encrypt a string", function(done) {
  		q.when(manager.encrypt(password))
  			.then(function(cipher_) {
  				cipher = cipher_;
  				done();
  			})
  			.catch(function(err) {
  				done(err);
  			});
  	});

  	it("should have an decrypt function", function() {
  		manager.decrypt.should.be.instanceOf(Function);
  	});

  	it("should be able to decrypt a cipher", function(done) {
  		q.when(manager.decrypt(cipher))
  			.then(function(decyphered_) {
  				decyphered = decyphered_;
  				done();
  			})
  			.catch(function(err) {
  				done(err);
  			});
  	});

  	it("expect secret and decyphered strings to match", function() {
  		return expect(password).to.equal(decyphered);
  	});

  	it("should have a hash function", function() {
  		manager.hash.should.be.instanceOf(Function);
  	});

  	it("should be able to hash a password", function(done) {
  		q.when(manager.hash(password))
  			.then(function(secret) {
  				hash = secret;
  				done();
  			})
  			.catch(function(err) {
  				done(err);
  			})
  	});

  	it("should have an verify function", function() {
  		manager.verify.should.be.instanceOf(Function);
  	});


  	it("should be able to verify a hash", function(done) {
  		q.when(manager.verify(hash, password))
  			.then(function(verified) {

  				if (verified) {
  					done();
  				} else {
  					done(new Error("Password could not be verified!"));
  				}

  			})
  			.catch(function(err) {
  				done(err);
  			})
  	});
  });

  describe("OAuth", function() {
  	var manager = require("./../lib/oauth-manager");

  	it("expect it to have a grant function", function() {
  		expect(manager.grant).to.be.instanceOf(Function);
  	});

  	it("expect it to have an authorise function", function() {
  		expect(manager.authorise).to.be.instanceOf(Function);
  	});

  	it.skip("expect it to have a authCodeGrant function", function() {
  		expect(manager.authCodeGrant).to.be.instanceOf(Function);
  	});
  });

  describe("MongoDB", function() {
  	var manager = require("./../lib/mongodb-manager");

    it("should have a connect function", function() {
  		manager.connect.should.be.instanceOf(Function);
  	});

  	it("should be able to connect to a database", function(done) {
      q.when(manager.connect())
        .then(function(connection) {
          global.test.mongodb = connection;
          done();
        })
        .catch(function(err) {
          done(err);
        })
    });

    it("should have a drop function", function() {
      manager.drop.should.be.instanceOf(Function);
    });

    it("should be able to drop a database", function(done) {
      q.when(manager.drop())
        .then(function() {
          done();
        })
        .catch(function(err) {
          done(err);
        })
    });

  });

  describe("Express", function() {
    var manager = require("./../lib/express-manager");

    it("should have a init function", function() {
  		manager.init.should.be.instanceOf(Function);
  	});

    it("should be able to initialize", function(done) {
      q.when(manager.init())
        .then(function(url) {
          global.test.url = url;
          done();
        })
        .catch(function(err) {
          done(err);
        })
    })
  })

});
