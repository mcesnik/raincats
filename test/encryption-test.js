var vows = require("vows"),
    assert = require("assert"),
    q = require("q");

console.log = function() { }
console.info = function() { }

vows.describe("Encryption Tests").addBatch({
	"Using encryption-manager": {
	  topic: require("./../lib/encryption-manager"),
	  "try to encrypt a password": {
	    topic: function(manager) {
	      var self = this;
	      q.when(manager.encrypt("testing"))
	        .then(function(cipher) {
	          self.callback(false, cipher)
	        })
	        .catch(function(err) {
	          self.callback(err);
	        })
	    },
	    "and make sure it worked": function(err, cipher) {
	      assert.isNotNull(cipher);
	      assert.isString(cipher);
	    },
	    "and then decrypt it": {
	      topic: function(cipher, manager) {
	          var self = this;
	          q.when(manager.decrypt(cipher))
	            .then(function(secret) {
	              self.callback(false, secret);
	            })
	            .catch(function(err) {
	              self.callback(err);
	            })
	      },
	      "back to its original": function(err, secret) {
	        assert.equal(secret, "testing");
	      }
	    }
	  }
	}
}).export(module);