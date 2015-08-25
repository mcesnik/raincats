var chai = require("chai"),
	assert = chai.assert,
    expect = chai.expect,
    should = chai.should()
    q = require("q");


//console.log = function() {}
console.info = function() {}


describe("Properties Manager", function() {
	var manager = require("./../lib/properties-manager");
	var properties = null;

	it("should be able to load from test.properties", function (done) {
	  process.env.properties = "test.properties";
	  
	  q.when(manager.getProperties())
	  	.then(function(props) {
	  		properties = props;
	  		done();
	  	})
	  	.catch(function(err) {
	  		//err.should.equal(null);
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

describe("Encryption Manager", function() {
	var manager = require("./../lib/encryption-manager");	
	
	var password = "aT3stP4assw0rd";
	var hash = null;

	it("should be able to encrypt a string", function(done) {
		q.when(manager.encrypt(password))
			.then(function(cipher) {
				password = cipher;
				done();
			})
			.catch(function(err) {
				done(err);
			});
	});

	it("should be able to decrypt a cipher", function(done) {
		q.when(manager.decrypt(password))
			.then(function(decrypted) {
				password = decrypted;
				done();
			})
			.catch(function(err) {
				done(err);
			});		
	});

	it("should be able to encrypt and decrypt the same string", function() {
		return password.should.equal("aT3stP4assw0rd");
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

	it("should be able to verify a hash", function(done) {
		q.when(manager.verify(hash, password))
			.then(function(verified) {
				
				if (verified) {
					done();	
				} else {
					done(new Error("Password and Hash could not be verified!"));
				}
				
			})
			.catch(function(err) {
				done(err);
			})
	});
});